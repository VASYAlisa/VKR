import React, { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./Layout/Layout"
import Events from "./Components/Event/Event"
import Login from "./Authorization/Login"
import Register from "./Authorization/Registration"
import Logoff from "./Authorization/LogOff"
import Locations from "./Components/Location/Locations"
import Cities from "./Components/Cities/Cities"
import Categories from "./Components/Categories/Categories"
import Reports from "./Components/Reports/Reports"
import Favorites from "./UserPanel/Favorites/Favorites"
import Tickets from "./UserPanel/Tickets/Tickets"
import Halls from "./Components/Halls/Halls"
import EventDetails from "./Components/Event/EventDetails"
import PromoCodes from "./Components/PromoCodes/PromoCodes"
import TicketPurchase from "./Components/Event/TicketPurchase"
import Profile from "./UserPanel/Profile/Profile"

const App = () => {
  const [user, setUser] = useState({
    isAuthenticated: false,
    userRole: null,
    accountId: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getUser()
  }, [setUser])

  const getUser = () => {
    setIsLoading(true) // Отображает состояние загрузки
    return fetch("api/account/isauthenticated") // Запрос к API
      .then((response) => {
        if (response.status === 401) {
          setUser({
            isAuthenticated: false,
            userRole: null,
            accountId: null,
          })
        }
        return response.json()
      })
      .then(
        (data) => {
          if (
            typeof data !== "undefined" &&
            typeof data.userName !== "undefined" &&
            typeof data.userRole !== "undefined"
          ) {
            setUser({
              isAuthenticated: true,
              userRole: data.userRole,
              accountId: data.accountId,
            })
          }
        },
        (error) => {
          console.log(error)
        }
      )
      .finally(() => setIsLoading(false)) // Загрузка окончена
  }

  return (
    <Router>
      {isLoading ? (
        <h3>Загрузка...</h3>
      ) : (
        <Routes>
          <Route path="/" element={<Layout user={user} setUser={setUser} />}>
            <Route index element={<Events user={user} />} />
            <Route path="events" element={<Events user={user} />} />
            <Route path="event/:id" element={<EventDetails user={user} />} />
            <Route path="event/:eventId/purchase" element={<TicketPurchase user={user} />} />
            <Route path="cities" element={<Cities user={user} />} />
            <Route path="categories" element={<Categories user={user} />} />
            <Route path="locations" element={<Locations user={user} />} />
            <Route path="halls" element={<Halls user={user} />} />
            <Route path="promocodes" element={<PromoCodes user={user} />} />
            <Route path="favorites" element={<Favorites user={user} />} />
            <Route path="tickets" element={<Tickets user={user} />} />
            <Route
              path="login"
              element={<Login user={user} setUser={setUser} />}
            />
            <Route path="logoff" element={<Logoff setUser={setUser} />} />
            <Route path="register" element={<Register setUser={setUser} />} />
            <Route path="reports" element={<Reports user={user} />} />
            <Route path="profile" element={<Profile user={user} />} />
            <Route path="*" element={<h3>404</h3>} />
          </Route>
        </Routes>
      )}
    </Router>
  )
}

export default App