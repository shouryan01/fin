use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      app.handle().plugin(tauri_plugin_opener::init())?;

      // Safety fallback: ensure main window is visible after 1.5s even if frontend signal fails
      let handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_millis(1500)).await;
        if let Some(w) = handle.get_webview_window("main") {
          let _ = w.show();
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}


