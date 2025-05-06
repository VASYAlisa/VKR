import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Col, Row, Select, message, Tooltip } from 'antd';
import { HeartOutlined, HeartFilled, RightOutlined, LeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import CreateEvent from './CreateEvent';
import UpdateEvent from './UpdateEvent';

const { Option } = Select;

const Events = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [updateEvent, setUpdateEvent] = useState(null);
  const [dateItems, setDateItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

  // Извлечение searchQuery из URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('query') || '';
    setSearchQuery(query);
  }, [location.search]);

  // Загрузка начальных данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, citiesRes, categoriesRes, favoritesRes] = await Promise.all([
          axios.get('/api/Events'),
          axios.get('/api/Cities'),
          axios.get('/api/Categories'),
          user.isAuthenticated && user.accountId
            ? axios.get(`/api/Favorites/ByAccount/${user.accountId}`)
            : Promise.resolve({ data: [] }),
        ]);
        setEvents(eventsRes.data);
        setFilteredEvents(eventsRes.data);
        setCities(citiesRes.data);
        setCategories(categoriesRes.data);
        setFavorites(favoritesRes.data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        message.error(error.response?.data?.message || 'Ошибка загрузки данных');
      }
    };
    fetchData();
  }, [user]);

  // Фильтрация событий
  useEffect(() => {
    const fetchFilteredEvents = async () => {
      try {
        const params = {};
        if (selectedCity) params.cityId = selectedCity;
        if (selectedCategory) params.categoryId = selectedCategory;
        if (selectedDate) {
          const startOfDay = new Date(selectedDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(selectedDate);
          endOfDay.setHours(23, 59, 59, 999);
          params.fromDate = startOfDay.toISOString();
          params.toDate = endOfDay.toISOString();
        }

        const response = await axios.get('/api/Events', { params });
        let updatedEvents = response.data;

        // Локальная фильтрация по searchQuery
        if (searchQuery) {
          updatedEvents = updatedEvents.filter(event =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setFilteredEvents(updatedEvents);
      } catch (error) {
        console.error('Ошибка фильтрации событий:', error);
        message.error('Ошибка фильтрации событий');
      }
    };
    fetchFilteredEvents();
  }, [selectedCity, selectedCategory, selectedDate, searchQuery]);

  // Инициализация дат для текущего месяца
  useEffect(() => {
    const today = new Date();
    setDateItems(generateDateItems(today));
  }, []);

  const handleCreate = (event) => {
    setEvents([...events, event]);
    setFilteredEvents([...filteredEvents, event]);
    setIsCreateModalVisible(false);
  };

  const handleUpdate = async (updatedEvent) => {
    try {
      if (!updatedEvent?.id) {
        throw new Error('ID события не определен');
      }
      setEvents(events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
      setFilteredEvents(filteredEvents.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
      setUpdateEvent(null);
      message.success('Событие обновлено');
    } catch (error) {
      console.error('Ошибка в handleUpdate:', error);
      message.error(error.message || error.response?.data?.message || 'Ошибка загрузки обновленных данных события');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/Events/${id}`);
      setEvents(events.filter((e) => e.id !== id));
      setFilteredEvents(filteredEvents.filter((e) => e.id !== id));
      setFavorites(favorites.filter((f) => f.eventId !== id));
      message.success('Событие удалено');
    } catch (error) {
      message.error(error.response?.data?.message || 'Ошибка удаления события');
    }
  };

  const toggleFavorite = async (eventId) => {
    if (!user.isAuthenticated) {
      message.warning('Пожалуйста, авторизируйтесь');
      return;
    }
    if (!user.accountId) {
      message.error('Аккаунт не настроен');
      return;
    }

    const isFavorite = favorites.some((f) => f.eventId === eventId);
    try {
      if (isFavorite) {
        await axios.delete(`/api/Favorites/ByAccountAndEvent?accountId=${user.accountId}&eventId=${eventId}`);
        setFavorites(favorites.filter((f) => f.eventId !== eventId));
        message.success('Удалено из избранного');
      } else {
        const response = await axios.post('/api/Favorites', {
          accountId: user.accountId,
          eventId,
        });
        setFavorites([...favorites, response.data]);
        message.success('Добавлено в избранное');
      }
    } catch (error) {
      message.error(error.response?.data?.message || (isFavorite ? 'Ошибка удаления из избранного' : 'Ошибка добавления в избранное'));
    }
  };

  const handleCardClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const getPriceDisplay = (event) => {
    if (!event) return "Не указана";
    if (event.basePrice) {
      return `${event.basePrice} руб.`;
    }
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const prices = event.ticketTypes.map((tt) => tt.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return minPrice === maxPrice
        ? `${minPrice} руб.`
        : `от ${minPrice} до ${maxPrice} руб.`;
    }
    if (event.hallId) {
      return "Цена зависит от выбранного места";
    }
    return "Не указана";
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      const firstDate = new Date(dateItems[0].date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (firstDate.getMonth() === today.getMonth() && firstDate.getFullYear() === today.getFullYear()) {
        message.info('Нельзя выбрать даты раньше текущего месяца');
        return;
      }
      // Переход на предыдущий месяц
      firstDate.setMonth(firstDate.getMonth() - 1);
      firstDate.setDate(1); // Начинаем с 1-го числа
      const newItems = generateDateItems(firstDate);
      setDateItems(newItems);
      scrollRef.current.scrollLeft = 0; // Сбрасываем прокрутку
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const firstDate = new Date(dateItems[0].date);
      // Переход на следующий месяц
      firstDate.setMonth(firstDate.getMonth() + 1);
      firstDate.setDate(1); // Начинаем с 1-го числа
      const newItems = generateDateItems(firstDate);
      setDateItems(newItems);
      scrollRef.current.scrollLeft = 0; // Сбрасываем прокрутку
    }
  };

  const generateDateItems = (startDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = [];
    const currentDate = new Date(startDate);
    currentDate.setDate(1); // Начинаем с 1-го числа месяца
    // Если это текущий месяц, начинаем с сегодняшнего дня
    if (
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    ) {
      currentDate.setDate(today.getDate());
    }

    // Определяем количество дней в месяце
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startDay = currentDate.getDate();

    for (let i = startDay; i <= lastDayOfMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      items.push({
        date,
        day: date.getDate(),
        dayName: date.toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', ''),
        month: date.toLocaleDateString('ru-RU', { month: 'long' }),
      });
    }
    return items;
  };

  const resetDateFilter = () => {
    setSelectedDate(null);
  };

  const renderDateItemsWithMonths = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemsWithMonths = [];
    let lastMonth = null;

    dateItems.forEach((item, index) => {
      const isFirstOfMonth = item.day === 1;
      const isToday =
        item.date.toDateString() === today.toDateString() &&
        item.date.getMonth() === today.getMonth() &&
        item.date.getFullYear() === today.getFullYear();
      const showMonth = isFirstOfMonth || (isToday && lastMonth !== item.month);

      if (showMonth) {
        itemsWithMonths.push({
          type: 'month',
          month: item.month.toUpperCase(),
          key: `month-${item.date.toISOString()}`,
        });
        lastMonth = item.month;
      }

      itemsWithMonths.push({
        type: 'date',
        item,
        index,
        key: item.date.toISOString(),
      });
    });

    return itemsWithMonths;
  };

  return (
    <div>
      <style>
        {`
          .date-scroll-container::-webkit-scrollbar {
            height: 6px;
          }
          .date-scroll-container::-webkit-scrollbar-track {
            background: #f0f2f5;
            border-radius: 3px;
          }
          .date-scroll-container::-webkit-scrollbar-thumb {
            background: #001529;
            border-radius: 3px;
          }
          .date-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #003a8c;
          }
          /* Для Firefox */
          .date-scroll-container {
            scrollbar-width: thin;
            scrollbar-color: #001529 #f0f2f5;
          }
          .date-item:hover {
            background: #e6f7ff;
            transform: scale(1.05);
            transition: all 0.2s ease;
          }
          .month-item {
            border-left: 2px solid #1890ff;
            padding-left: 8px;
            font-weight: 600;
            color: #001529;
          }
          .scroll-button {
            transition: all 0.3s ease;
          }
          .scroll-button:hover {
            background: #1890ff;
            color: #fff;
          }
        `}
      </style>
      
      <div style={{ marginBottom: '20px', width: '100%', position: 'relative' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <Button
            icon={<LeftOutlined />}
            onClick={scrollLeft}
            className="scroll-button"
            style={{
              marginRight: '8px',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              border: '1px solid #d9d9d9',
            }}
          />
          <div
            ref={scrollRef}
            className="date-scroll-container"
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              gap: '8px',
              flex: 1,
              padding: '8px 0',
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            {renderDateItemsWithMonths().map((element) => {
              if (element.type === 'month') {
                return (
                  <div
                    key={element.key}
                    className="month-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '80px',
                      padding: '8px',
                      fontSize: '14px',
                      textAlign: 'center',
                    }}
                  >
                    {element.month}
                  </div>
                );
              }

              const { item } = element;
              const isWeekend = item.dayName === 'сб' || item.dayName === 'вс';
              const dayColor = isWeekend ? '#ff4d4f' : '#001529';
              const isSelected = selectedDate && selectedDate.toDateString() === item.date.toDateString();

              return (
                <div
                  key={item.date.toISOString()}
                  onClick={() => setSelectedDate(item.date)}
                  className="date-item"
                  style={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    minWidth: '60px',
                    padding: '8px',
                    border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    borderRadius: '8px',
                    background: isSelected ? '#e6f7ff' : '#fff',
                    boxShadow: isSelected ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSelected && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        color: '#ff4d4f',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        resetDateFilter();
                      }}
                    >
                      ✕
                    </span>
                  )}
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: dayColor }}>{item.day}</div>
                  <div style={{ color: '#888', fontSize: '12px' }}>{item.dayName}</div>
                </div>
              );
            })}
          </div>
          <Button
            icon={<RightOutlined />}
            onClick={scrollRight}
            className="scroll-button"
            style={{
              marginLeft: '8px',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              border: '1px solid #d9d9d9',
            }}
          />
        </div>
      </div>
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col>
          <Select
            placeholder="Выберите город"
            style={{ width: 200 }}
            onChange={setSelectedCity}
            allowClear
          >
            {cities.map((city) => (
              <Option key={city.id} value={city.id}>
                {city.title}
              </Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Select
            placeholder="Выберите категорию"
            style={{ width: 200 }}
            onChange={setSelectedCategory}
            allowClear
          >
            {categories.map((category) => (
              <Option key={category.id} value={category.id}>
                {category.title}
              </Option>
            ))}
          </Select>
        </Col>
        {user.userRole === 'admin' && (
          <Col>
            <Button type="primary" onClick={() => setIsCreateModalVisible(true)}>
              Создать событие
            </Button>
          </Col>
        )}
      </Row>
      <Row gutter={[16, 16]}>
        {filteredEvents.length === 0 ? (
          <Col span={24}>
            <p style={{ textAlign: 'center' }}>
              {searchQuery ? `Нет событий, соответствующих "${searchQuery}"` : selectedDate ? `Нет событий на ${selectedDate.toLocaleDateString('ru-RU')}` : 'Нет событий'}
            </p>
          </Col>
        ) : (
          filteredEvents.map((event) => (
            <Col xs={24} sm={12} md={8} key={event.id}>
              <Card
                hoverable
                cover={
                  <div style={{ position: 'relative' }}>
                    <img
                      alt={event.title}
                      src={event.image || 'https://via.placeholder.com/150'}
                      style={{ maxHeight: 265, width: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {getPriceDisplay(event)}
                    </div>
                  </div>
                }
                onClick={() => handleCardClick(event.id)}
                actions={
                  user.userRole === 'admin'
                    ? [
                        <Button onClick={(e) => { e.stopPropagation(); setUpdateEvent(event); }}>
                          Редактировать
                        </Button>,
                        <Button danger onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}>
                          Удалить
                        </Button>,
                      ]
                    : [
                        <Tooltip title={favorites.some((f) => f.eventId === event.id) ? 'Удалить из избранного' : 'Добавить в избранное'}>
                          {favorites.some((f) => f.eventId === event.id) ? (
                            <HeartFilled
                              style={{ color: 'red', fontSize: '20px' }}
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(event.id); }}
                            />
                          ) : (
                            <HeartOutlined
                              style={{ fontSize: '20px' }}
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(event.id); }}
                            />
                          )}
                        </Tooltip>,
                      ]
                }
              >
                <Card.Meta
                  title={event.title}
                  style={{ height: 120}}
                  description={
                    <>
                      <p>Дата и время: {event.date ? new Date(event.date).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : 'Не указана'}</p>
                      <p>Локация: {event.location?.name || 'Не указана'}</p>
                    </>
                  }
                />
              </Card>
            </Col>
          ))
        )}
      </Row>
      <CreateEvent
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onCreate={handleCreate}
      />
      {updateEvent && (
        <UpdateEvent
          event={updateEvent}
          onCancel={() => setUpdateEvent(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default Events;