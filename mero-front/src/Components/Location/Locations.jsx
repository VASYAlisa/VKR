import React, { useState, useEffect } from 'react';
import { Table, Button, message } from 'antd';
import axios from 'axios';
import CreateLocation from './CreateLocation';
import UpdateLocation from './UpdateLocation';

const Locations = ({ user }) => {
  const [locations, setLocations] = useState([]);
  const [cities, setCities] = useState([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [updateLocation, setUpdateLocation] = useState(null);

  const fetchData = async () => {
    try {
      const [locationsRes, citiesRes] = await Promise.all([
        axios.get('/api/Locations'),
        axios.get('/api/Cities'),
      ]);
      setLocations(locationsRes.data);
      setCities(citiesRes.data);
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
    setUpdateLocation(null);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/Locations/${id}`);
      await fetchData();
      message.success('Локация удалена');
    } catch (error) {
      message.error('Ошибка удаления локации');
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Город',
      dataIndex: 'cityId',
      key: 'cityId',
      render: (cityId) => cities.find((c) => c.id === cityId)?.title || 'Не указан',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button onClick={() => setUpdateLocation(record)} style={{ marginRight: 8 }}>
            Редактировать
          </Button>
          <Button danger onClick={() => handleDelete(record.id)}>
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
        Добавить локацию
      </Button>
      <Table
        dataSource={locations}
        columns={columns}
        rowKey="id"
        locale={{ emptyText: 'Нет локаций' }}
      />
      <CreateLocation
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onCreate={handleCreate}
      />
      {updateLocation && (
        <UpdateLocation
          location={updateLocation}
          onCancel={() => setUpdateLocation(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default Locations;