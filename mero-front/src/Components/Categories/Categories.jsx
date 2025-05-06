import React, { useState, useEffect } from "react"
import { Table, Button, message } from "antd"
import axios from "axios"
import CreateCategory from "./CreateCategory"
import UpdateCategory from "./UpdateCategory"

const Categories = ({ user }) => {
  const [categories, setCategories] = useState([])
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [updateCategory, setUpdateCategory] = useState(null)

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/Categories")
      setCategories(response.data)
    } catch (error) {
      message.error("Ошибка загрузки категорий")
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = async (category) => {
    await fetchCategories()
    setIsCreateModalVisible(false)
  }

  const handleUpdate = async () => {
    await fetchCategories()
    setUpdateCategory(null)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/Categories/${id}`)
      await fetchCategories()
      message.success("Категория удалена")
    } catch (error) {
      message.error("Ошибка удаления категории")
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
            onClick={() => setUpdateCategory(record)}
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
        Добавить категорию
      </Button>
      <Table
        dataSource={categories}
        columns={columns}
        rowKey="id"
        locale={{ emptyText: "Нет категорий" }}
      />
      <CreateCategory
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onCreate={handleCreate}
      />
      {updateCategory && (
        <UpdateCategory
          category={updateCategory}
          onCancel={() => setUpdateCategory(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}

export default Categories
