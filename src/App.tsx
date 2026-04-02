import { MemoryRouter, Route } from "react-router-dom"
import Jobs from "@pages/Jobs"
import Config from "@pages/Config"

const App = () => {
  return (
    <MemoryRouter>
      <Route path="/" element={<Jobs />} />
      <Route path="/config" element={<Config />} />
    </MemoryRouter>
  )
}

export default App