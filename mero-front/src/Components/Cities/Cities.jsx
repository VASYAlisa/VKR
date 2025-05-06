import React, { useState, useEffect } from "react"
import { Table, Button, message } from "antd"
import axios from "axios"
import CreateCity from "./CreateCity"
import UpdateCity from "./UpdateCity"

const Cities = ({ user }) => {
  const [cities, setCities] = useState([])
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [updateCity, setUpdateCity] = useState(null)

  const fetchCities = async () => {
    try {
      const response = await axios.get("/api/Cities")
      setCities(response.data)
    } catch (error) {
      message.error("Ошибка загрузки городов")
    }
  }

  useEffect(() => {
    fetchCities()
  }, [])

  const handleCreate = async () => {
    await fetchCities()
    setIsCreateModalVisible(false)
  }

  const handleUpdate = async () => {
    await fetchCities()
    setUpdateCity(null)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/Cities/${id}`)
      await fetchCities()
      message.success("Город удалён")
    } catch (error) {
      message.error("Ошибка удаления города")
    }
  }

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <>
          <Button
            onClick={() => setUpdateCity(record)}
            style={{ marginRight: 8 }}
          >
            Редактировать
          </Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Удалить
          </Button>
        </>
      ),
    },
  ]

  if (user.userRole !== "admin") {
    return <div>Доступ запрещён. Эта страница только для администраторов.</div>
  }

  return (
    <div>
      <Button
        type="primary"
        onClick={() => setIsCreateModalVisible(true)}
        style={{ marginBottom: 16 }}
      >
        Добавить город
      </Button>
      <Table
        dataSource={cities}
        columns={columns}
        rowKey="id"
        locale={{ emptyText: "Нет городов" }}
      />
      <CreateCity
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onCreate={handleCreate}
      />
      {updateCity && (
        <UpdateCity
          city={updateCity}
          onCancel={() => setUpdateCity(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}

export default Cities
