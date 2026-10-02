import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import Chatbot from './components/Chatbot'
import Footer from './components/Footer'
import Home from './pages/Home'
import Detection from './pages/Detection'
import History from './pages/History'
import About from './pages/About'
import DiseaseLibrary from './pages/DiseaseLibrary'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Plants from './pages/Plants'
import Irrigation from './pages/Irrigation'
import Fertilizer from './pages/Fertilizer'
import Growth from './pages/Growth'
import Soil from './pages/Soil'
import Harvest from './pages/Harvest'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Seasonal from './pages/Seasonal'
import ImportPlants from './pages/ImportPlants'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen flex flex-col">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected routes */}
            <Route path="/*" element={
              <PrivateRoute>
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/"                element={<Home />} />
                    <Route path="/dashboard"       element={<Dashboard />} />
                    <Route path="/detection"       element={<Detection />} />
                    <Route path="/plants"          element={<Plants />} />
                    <Route path="/irrigation"      element={<Irrigation />} />
                    <Route path="/fertilizer"      element={<Fertilizer />} />
                    <Route path="/growth"          element={<Growth />} />
                    <Route path="/soil"            element={<Soil />} />
                    <Route path="/harvest"         element={<Harvest />} />
                    <Route path="/expenses"        element={<Expenses />} />
                    <Route path="/seasonal"        element={<Seasonal />} />
                    <Route path="/reports"         element={<Reports />} />
                    <Route path="/import"          element={<ImportPlants />} />
                    <Route path="/history"         element={<History />} />
                    <Route path="/diseases"        element={<DiseaseLibrary />} />
                    <Route path="/about"           element={<About />} />
                    <Route path="*"                element={<NotFound />} />
                  </Routes>
                </main>
                <Chatbot />
                <Footer />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
