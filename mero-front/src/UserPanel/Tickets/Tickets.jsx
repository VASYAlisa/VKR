import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Spin } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const Tickets = ({ user }) => {
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.isAuthenticated) {
      fetchTickets();
    }
  }, [user, location.state?.refresh]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/Tickets/ByAccount/${user.accountId}`);
      setTickets(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке билетов:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user.isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Title level={2}>Билеты</Title>
        <Text>Пожалуйста, авторизируйтесь, чтобы просматривать билеты.</Text>
        <br />
        <Button type="primary" style={{ marginTop: '16px' }}>
          <Link to="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2}>Билеты</Title>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <Spin size="large" />
        </div>
      ) : tickets.length === 0 ? (
        <Text>У вас пока нет купленных билетов.</Text>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tickets.map((ticket) => (
            <Card key={ticket.id} style={{ width: '100%' }}>
              <Title level={4}>{ticket.event?.title || 'Событие не указано'}</Title>
              <Text strong>Дата события: </Text>
              <Text>{ticket.event?.date ? new Date(ticket.event.date).toLocaleString('ru-RU') : 'Не указана'}</Text>
              <br />
              <Text strong>Локация: </Text>
              <Text>
                {ticket.event?.location?.name || 'Не указана'},{' '}
                {ticket.event?.location?.city?.title || 'Не указан'}
              </Text>
              <br />
              {ticket.ticketPlaces && ticket.ticketPlaces.length > 0 ? (
                <>
                  <Text strong>Места: </Text>
                  <Text>
                    {ticket.ticketPlaces
                      .map(
                        (tp) =>
                          `Ряд ${tp.place?.rowNumber || 'N/A'}, Место ${
                            tp.place?.seatNumber || 'N/A'
                          } (${(tp.actualPrice != null ? tp.actualPrice : 0).toFixed(2)} руб.)`
                      )
                      .join('; ')}
                  </Text>
                </>
              ) : ticket.ticketType ? (
                <>
                  <Text strong>Категория билета: </Text>
                  <Text>
                    {ticket.ticketType.name} (
                    {(ticket.orderAmount != null ? ticket.orderAmount : 0).toFixed(2)} руб.)
                  </Text>
                </>
              ) : (
                <>
                  <Text strong>Тип: </Text>
                  <Text>
                    Фиксированная цена (
                    {(ticket.orderAmount != null ? ticket.orderAmount : 0).toFixed(2)} руб.)
                  </Text>
                </>
              )}
              <br />
              <Text strong>Дата покупки: </Text>
              <Text>{ticket.date ? new Date(ticket.date).toLocaleString('ru-RU') : 'Не указана'}</Text>
              <br />
              <Text strong>Сумма покупки: </Text>
              <Text>{(ticket.orderAmount != null ? ticket.orderAmount : 0).toFixed(2)} руб.</Text>
              <br />
              <Text strong>Сумма скидки: </Text>
              <Text>{(ticket.discountAmount != null ? ticket.discountAmount : 0).toFixed(2)} руб.</Text>
              <br />
              {ticket.promoCode && (
                <>
                  <Text strong>Промокод: </Text>
                  <Text>{ticket.promoCode.title}</Text>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tickets;