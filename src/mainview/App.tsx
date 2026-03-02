function App() {
	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="electrobun-webkit-app-region-drag active:cursor-grabbing sticky top-0 z-10 h-7 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
				<div className="mx-auto h-full max-w-5xl" />
			</div>
			<div className="electrobun-webkit-app-region-no-drag min-h-[calc(100vh-24px)]" />
		</div>
	);
}

export default App;
