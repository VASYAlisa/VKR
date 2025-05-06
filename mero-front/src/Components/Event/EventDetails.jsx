import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Modal, message, Typography, Row, Col, Card, Image } from "antd"
import axios from "axios"

const { Title, Paragraph } = Typography

const EventDetails = ({ user }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/Events/${id}`)
        setEvent(response.data)
        setLoading(false)
      } catch (error) {
        message.error(
          error.response?.data?.message || "Ошибка загрузки события"
        )
        setLoading(false)
      }
    }
    fetchEvent()
  }, [id])

  const handleBuyTicket = () => {
    if (!user.isAuthenticated) {
      setIsRegisterModalVisible(true)
    } else {
      navigate(`/event/${id}/purchase`)
    }
  }

  const handleRegister = () => {
    setIsRegisterModalVisible(false)
    navigate("/register")
  }

  const getPriceDisplay = () => {
    if (!event) return "Не указана"
    if (event.basePrice) {
      return `${event.basePrice} руб.`
    }
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const prices = event.ticketTypes.map((tt) => tt.price)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      return minPrice === maxPrice
        ? `${minPrice} руб.`
        : `от ${minPrice} до ${maxPrice} руб.`
    }
    if (event.hallId) {
      return "Цена зависит от выбранного места"
    }
    return "Не указана"
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  if (!event) {
    return <div>Событие не найдено</div>
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: "24px" }}>
        {event.title}
      </Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Image
            src={event.image || "https://via.placeholder.com/400"}
            alt={event.title}
            style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
            preview={false}
          />
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Paragraph>
              <strong>Дата:</strong>{" "}
              {event.date
                ? new Date(event.date).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Не указана"}
            </Paragraph>
            <Paragraph>
              <strong>Город:</strong>{" "}
              {event.location?.city?.title || "Не указан"}
            </Paragraph>
            <Paragraph>
              <strong>Локация:</strong> {event.location?.name || "Не указана"}
            </Paragraph>
            <Paragraph>
              <strong>Описание:</strong>{" "}
              {event.description || "Описание отсутствует"}
            </Paragraph>
            <Paragraph>
              <strong>Цена:</strong> {getPriceDisplay()}
            </Paragraph>
          </Card>
        </Col>
      </Row>
      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <Button
          type="primary"
          size="large"
          shape="round"
          onClick={handleBuyTicket}
          style={{ padding: "0 48px", height: "48px", fontSize: "18px" }}
        >
          Купить билет
        </Button>
      </div>

      <Modal
        title="Требуется регистрация"
        open={isRegisterModalVisible}
        onCancel={() => setIsRegisterModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRegisterModalVisible(false)}>
            Закрыть
          </Button>,
          <Button key="register" type="primary" onClick={handleRegister}>
            Зарегистрироваться
          </Button>,
        ]}
      >
        <p>
          Для покупки билета необходимо зарегистрироваться. Хотите перейти на
          страницу регистрации?
        </p>
      </Modal>
    </div>
  )
}

export default EventDetails