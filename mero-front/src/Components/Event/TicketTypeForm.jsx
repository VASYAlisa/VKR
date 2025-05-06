import React, { useState } from 'react';
import { Input, InputNumber, Button, Table, message } from 'antd';
import axios from 'axios';

const TicketTypeForm = ({ ticketTypes, setTicketTypes, isEditing = false, eventId }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(null);
  const [maxAvailable, setMaxAvailable] = useState(null);

  const addTicketType = async () => {
    if (!name || price == null || price < 0) {
      message.error('Заполните название и цену билета');
      return;
    }
    const newTicketType = {
      id: isEditing ? `temp-${Date.now()}` : Date.now(), // Уникальный временный ID
      name,
      price,
      maxAvailable: maxAvailable && maxAvailable > 0 ? maxAvailable : null,
    };
    if (isEditing && eventId) {
      try {
        const response = await axios.post('/api/TicketTypes', {
          name: newTicketType.name,
          price: newTicketType.price,
          maxAvailable: newTicketType.maxAvailable,
          eventId,
        });
        setTicketTypes([...ticketTypes, response.data]);
      } catch (error) {
        message.error(error.response?.data?.message || 'Ошибка добавления типа билета');
        return;
      }
    } else {
      setTicketTypes([...ticketTypes, newTicketType]);
    }
    setName('');
    setPrice(null);
    setMaxAvailable(null);
    message.success('Тип билета добавлен');
  };

  const deleteTicketType = async (id) => {
    if (isEditing && eventId) {
      try {
        const ticketType = ticketTypes.find((tt) => tt.id === id);
        if (ticketType && !ticketType.id.toString().startsWith('temp-')) {
          await axios.delete(`/api/TicketTypes/${id}`);
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Ошибка удаления типа билета');
        return;
      }
    }
    setTicketTypes(ticketTypes.filter((tt) => tt.id !== id));
    message.success('Тип билета удалён');
  };

  const columns = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Цена', dataIndex: 'price', key: 'price', render: (price) => `${price} руб.` },
    {
      title: 'Макс. количество',
      dataIndex: 'maxAvailable',
      key: 'maxAvailable',
      render: (maxAvailable) => maxAvailable || 'Не ограничено',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Button danger onClick={() => deleteTicketType(record.id)}>
          Удалить
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h3>Типы билетов</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <Input
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '200px' }}
        />
        <InputNumber
          placeholder="Цена"
          min={0}
          value={price}
          onChange={(value) => setPrice(value)}
          style={{ width: '150px' }}
        />
        <InputNumber
          placeholder="Макс. количество"
          min={1}
          value={maxAvailable}
          onChange={(value) => setMaxAvailable(value)}
          style={{ width: '150px' }}
        />
        <Button type="primary" onClick={addTicketType}>
          Добавить
        </Button>
      </div>
      <Table
        dataSource={ticketTypes}
        columns={columns}
        rowKey="id"
        locale={{ emptyText: 'Нет типов билетов' }}
      />
    </div>
  );
};

export default TicketTypeForm;