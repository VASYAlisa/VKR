import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Row, message, Tooltip } from 'antd';
import { HeartFilled } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Favorites = ({ user }) => {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (user.isAuthenticated && user.accountId) {
        try {
          const response = await axios.get(`/api/Favorites/ByAccount/${user.accountId}`);
          setFavorites(response.data);
        } catch (error) {
          console.error('Ошибка загрузки избранного:', error);
          message.error(error.response?.data?.message || 'Ошибка загрузки избранного');
        }
      } else if (user.isAuthenticated && !user.accountId) {
        message.error('Аккаунт не настроен. Пожалуйста, свяжитесь с поддержкой.');
      }
    };
    fetchFavorites();
  }, [user]);

  const removeFromFavorites = async (eventId) => {
    if (!user.accountId) {
      message.error('Аккаунт не настроен');
      return;
    }
    try {
      await axios.delete(`/api/Favorites/ByAccountAndEvent?accountId=${user.accountId}&eventId=${eventId}`);
      setFavorites(favorites.filter((f) => f.eventId !== eventId));
      message.success('Удалено из избранного');
    } catch (error) {
      message.error(error.response?.data?.message || 'Ошибка удаления из избранного');
    }
  };

  const handleCardClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  if (!user.isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Избранное</h2>
        <p>Пожалуйста, авторизируйтесь, чтобы просматривать избранное.</p>
        <Button type="primary">
          <Link to="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2>Избранное</h2>
      {favorites.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Нет избранных событий</p>
      ) : (
        <Row gutter={[16, 16]}>
          {favorites.map((favorite) => (
            <Col xs={24} sm={12} md={8} key={favorite.id} >
              <Card
                hoverable
                cover={<img alt={favorite.event?.title} style={{ maxHeight: 265, width: '100%', objectFit: 'cover' }} src={favorite.event?.image || 'https://via.placeholder.com/150'} />}
                
                onClick={() => handleCardClick(favorite.eventId)}
                actions={[
                  <Tooltip title="Удалить из избранного">
                    <HeartFilled
                      style={{ color: 'red', fontSize: '20px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromFavorites(favorite.eventId);
                     
                      }}
                    />
                  </Tooltip>,
                ]}
              >
                <Card.Meta
                  title={favorite.event?.title || 'Событие не найдено'}
                  style={{ height: 120}}
                  description={
                    <>
                      <p>Дата: {favorite.event?.date ? new Date(favorite.event.date).toLocaleDateString() : 'Не указана'}</p>
                      <p>Локация: {favorite.event?.location?.name || 'Не указана'}</p>
                      
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Favorites;