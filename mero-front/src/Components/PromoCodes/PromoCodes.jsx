import React, { useState, useEffect } from 'react';
import { Table, Button, message, Tag } from 'antd';
import axios from 'axios';
import CreatePromoCode from './CreatePromoCodes';
import UpdatePromoCode from './UpdatePromoCodes';

const PromoCodes = ({ user }) => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [events, setEvents] = useState([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [updatePromoCode, setUpdatePromoCode] = useState(null);

  const fetchData = async () => {
    try {
      const [promoCodesRes, eventsRes] = await Promise.all([
        axios.get('/api/PromoCodes').catch(err => {
          console.error('Ошибка загрузки промокодов:', err.response?.data || err.message);
          throw err;
        }),
        axios.get('/api/Events').catch(err => {
          console.error('Ошибка загрузки событий:', err.response?.data || err.message);
          throw err;
        }),
      ]);
      console.log('Промокоды:', promoCodesRes.data);
      console.log('События:', eventsRes.data);
      setPromoCodes(promoCodesRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      message.error('Ошибка загрузки данных');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    await fetchData();
    setIsCreateModalVisible(false);
  };

  const handleUpdate = async () => {
    await fetchData();
    setUpdatePromoCode(null);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/PromoCodes/${id}`);
      await fetchData();
      message.success('Промокод удалён');
    } catch (error) {
      message.error('Ошибка удаления промокода');
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Тип скидки',
      dataIndex: 'discountType',
      key: 'discountType',
      render: (discountType) => discountType === 'Percentage' ? 'Процент' : 'Фиксированная',
    },
    {
      title: 'Размер скидки',
      dataIndex: 'discountValue',
      key: 'discountValue',
      render: (discountValue, record) => 
        `${discountValue}${record.discountType === 'Percentage' ? '%' : ' ₽'}`,
    },
    {
      title: 'Максимум использований',
      dataIndex: 'maxUsages',
      key: 'maxUsages',
      render: (maxUsages) => maxUsages ?? 'Не ограничено',
    },
    {
      title: 'Текущее кол-во использований',
      dataIndex: 'usagesCount',
      key: 'usagesCount',
    },
    {
      title: 'Срок действия',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (validUntil) => new Date(validUntil).toLocaleDateString(),
    },
    {
      title: 'Активен',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Да' : 'Нет'}
        </Tag>
      ),
    },
    {
      title: 'Событие',
      dataIndex: 'eventId',
      key: 'eventId',
      render: (eventId) => events.find((e) => e.id === eventId)?.title || 'Не указано',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button onClick={() => setUpdatePromoCode(record)} style={{ marginRight: 8, width: 120 }}>
            Редактировать
          </Button>
          <Button danger onClick={() => handleDelete(record.id)} style={{  marginTop: 8, width: 120 }}>
            Удалить
          </Button>
        </>
      ),
    },
  ];

  if (user.userRole !== 'admin') {
    return <div>Доступ запрещён. Эта страница только для администраторов.</div>;
  }

  return (
    <div>
      <Button
        type="primary"
        onClick={() => setIsCreateModalVisible(true)}
        style={{ marginBottom: 16 }}
      >
        Добавить промокод
      </Button>
      <Table
        dataSource={promoCodes}
        columns={columns}
        rowKey="id"
        locale={{ emptyText: 'Нет промокодов' }}
      />
      <CreatePromoCode
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onCreate={handleCreate}
      />
      {updatePromoCode && (
        <UpdatePromoCode
          promoCode={updatePromoCode}
          onCancel={() => setUpdatePromoCode(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default PromoCodes;