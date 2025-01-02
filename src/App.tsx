import "./App.css";
import { AppRouter } from "./routes";
import { ThemeProvider } from "@/components/ThemeProvider"

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <main className="container">
        <AppRouter />
      </main>
    </ThemeProvider>
  );
}

export default App;
