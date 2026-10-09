use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::{
	Row, TypeInfo, Value, ValueRef,
	sqlite::{SqliteArguments, SqliteValueRef},
};
use tauri::Manager;

#[derive(Serialize, Deserialize)]
pub struct ProxyQueryResult {
	pub rows: Vec<Vec<JsonValue>>,
}

#[derive(Deserialize)]
pub struct BatchQuery {
	pub sql: String,
	pub params: Vec<JsonValue>,
	pub method: String,
}

fn decode_sqlite_value(v: SqliteValueRef) -> Result<JsonValue, String> {
	if v.is_null() {
		return Ok(JsonValue::Null);
	}

	let res = match v.type_info().name() {
		"TEXT" => {
			if let Ok(s) = v.to_owned().try_decode::<String>() {
				JsonValue::String(s)
			} else {
				JsonValue::Null
			}
		}
		"REAL" => {
			if let Ok(f) = v.to_owned().try_decode::<f64>() {
				JsonValue::from(f)
			} else {
				JsonValue::Null
			}
		}
		"INTEGER" | "NUMERIC" => {
			if let Ok(i) = v.to_owned().try_decode::<i64>() {
				JsonValue::Number(i.into())
			} else {
				JsonValue::Null
			}
		}
		"BOOLEAN" => {
			if let Ok(b) = v.to_owned().try_decode::<bool>() {
				JsonValue::Bool(b)
			} else {
				JsonValue::Null
			}
		}
		"BLOB" => {
			if let Ok(bytes) = v.to_owned().try_decode::<Vec<u8>>() {
				JsonValue::Array(
					bytes
						.into_iter()
						.map(|n| JsonValue::Number(n.into()))
						.collect(),
				)
			} else {
				JsonValue::Null
			}
		}
		"NULL" => JsonValue::Null,
		_ => {
			if let Ok(s) = v.to_owned().try_decode::<String>() {
				JsonValue::String(s)
			} else {
				JsonValue::Null
			}
		}
	};

	Ok(res)
}

fn bind_json_params<'a>(
	mut query: sqlx::query::Query<'a, sqlx::Sqlite, SqliteArguments<'a>>,
	params: &'a [JsonValue],
) -> sqlx::query::Query<'a, sqlx::Sqlite, SqliteArguments<'a>> {
	for value in params {
		if value.is_null() {
			query = query.bind(None::<String>);
		} else if let Some(s) = value.as_str() {
			query = query.bind(s);
		} else if let Some(i) = value.as_i64() {
			query = query.bind(i);
		} else if let Some(f) = value.as_f64() {
			query = query.bind(f);
		} else if let Some(b) = value.as_bool() {
			query = query.bind(b);
		} else {
			query = query.bind(value.to_string());
		}
	}
	query
}

async fn get_sqlite_pool(
	app: &tauri::AppHandle,
	db_name: &str,
) -> Result<sqlx::Pool<sqlx::Sqlite>, String> {
	let instances = app.state::<tauri_plugin_sql::DbInstances>();
	let instances_guard = instances.0.read().await;

	#[allow(unreachable_patterns)]
	match instances_guard.get(db_name) {
		Some(tauri_plugin_sql::DbPool::Sqlite(pool)) => Ok(pool.clone()),
		Some(_) => Err(format!("Database '{}' is not a SQLite database", db_name)),
		None => Err(format!(
			"Database '{}' is not loaded yet in DbInstances",
			db_name
		)),
	}
}

#[tauri::command]
pub async fn proxy_query(
	app: tauri::AppHandle,
	db: String,
	sql: String,
	params: Vec<JsonValue>,
	method: String,
) -> Result<ProxyQueryResult, String> {
	let pool = get_sqlite_pool(&app, &db).await?;

	if method == "run" {
		let query = bind_json_params(sqlx::query(&sql), &params);
		query.execute(&pool).await.map_err(|e| e.to_string())?;
		return Ok(ProxyQueryResult { rows: Vec::new() });
	}

	let query = bind_json_params(sqlx::query(&sql), &params);
	let rows = query.fetch_all(&pool).await.map_err(|e| e.to_string())?;

	let mut result_rows = Vec::with_capacity(rows.len());
	for row in rows {
		let mut row_values = Vec::with_capacity(row.columns().len());
		for (i, _) in row.columns().iter().enumerate() {
			let val_ref = row.try_get_raw(i).map_err(|e| e.to_string())?;
			row_values.push(decode_sqlite_value(val_ref)?);
		}
		result_rows.push(row_values);
	}

	Ok(ProxyQueryResult { rows: result_rows })
}

#[tauri::command]
pub async fn proxy_batch(
	app: tauri::AppHandle,
	db: String,
	queries: Vec<BatchQuery>,
) -> Result<Vec<ProxyQueryResult>, String> {
	let pool = get_sqlite_pool(&app, &db).await?;
	let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;

	let _ = sqlx::query("PRAGMA foreign_keys = ON;").execute(&mut *conn).await;

	let has_explicit_tx = queries.iter().any(|q| {
		let s = q.sql.trim().to_uppercase();
		s.starts_with("BEGIN") || s.starts_with("SAVEPOINT")
	});

	if !has_explicit_tx {
		sqlx::query("BEGIN").execute(&mut *conn).await.map_err(|e| e.to_string())?;
	}

	let mut results = Vec::with_capacity(queries.len());

	for q in &queries {
		if q.method == "run" {
			let query = bind_json_params(sqlx::query(&q.sql), &q.params);
			if let Err(e) = query.execute(&mut *conn).await {
				if !has_explicit_tx {
					let _ = sqlx::query("ROLLBACK").execute(&mut *conn).await;
				}
				return Err(e.to_string());
			}
			results.push(ProxyQueryResult { rows: Vec::new() });
		} else {
			let query = bind_json_params(sqlx::query(&q.sql), &q.params);
			let rows = match query.fetch_all(&mut *conn).await {
				Ok(r) => r,
				Err(e) => {
					if !has_explicit_tx {
						let _ = sqlx::query("ROLLBACK").execute(&mut *conn).await;
					}
					return Err(e.to_string());
				}
			};

			let mut result_rows = Vec::with_capacity(rows.len());
			for row in rows {
				let mut row_values = Vec::with_capacity(row.columns().len());
				for (i, _) in row.columns().iter().enumerate() {
					let val_ref = row.try_get_raw(i).map_err(|e| e.to_string())?;
					row_values.push(decode_sqlite_value(val_ref)?);
				}
				result_rows.push(row_values);
			}
			results.push(ProxyQueryResult { rows: result_rows });
		}
	}

	if !has_explicit_tx {
		sqlx::query("COMMIT").execute(&mut *conn).await.map_err(|e| e.to_string())?;
	}

	Ok(results)
}
