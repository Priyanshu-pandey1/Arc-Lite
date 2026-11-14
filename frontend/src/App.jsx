import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Chat from './pages/Chat'
import FAQManagement from './pages/FAQManagement'
import Analytics from './pages/Analytics'
import RequireStaff from './components/faq/RequireStaff'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/*
          Chat owns the index route only. The login dialog is driven by a
          `?login=1` search param (see MainLayout) instead of a separate
          /login route — a sibling route would unmount and remount Chat,
          wiping the draft, scroll position and loaded history (the
          "chat flickers when I click Login" bug).
        */}
        <Route element={<Chat />} index />
        <Route element={<Navigate replace to="/?login=1" />} path="/login" />
        <Route
          element={
            <RequireStaff title="FAQ Management">
              <FAQManagement />
            </RequireStaff>
          }
          path="/faq-management"
        />
        <Route
          element={
            <RequireStaff title="Analytics Dashboard">
              <Analytics />
            </RequireStaff>
          }
          path="/analytics"
        />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Route>
    </Routes>
  )
}
