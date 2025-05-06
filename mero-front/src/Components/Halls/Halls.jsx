import React, { useState, useEffect } from 'react';
import { Table, Button, message, Modal } from 'antd';
import axios from 'axios';
import CreateHall from './CreateHall';
import UpdateHall from './UpdateHall';
import SeatGrid from './SeatGrid';

const Halls = ({ user }) => {
  const [halls, setHalls] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [updateHall, setUpdateHall] = useState(null);
  const [selectedHall, setSelectedHall] = useState(null);
  const [isSeatModalVisible, setIsSeatModalVisible] = useState(false);

  const fetchHalls = async () => {
    try {
      const response = await axios.get('/api/Halls', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const validHalls = response.data.filter(hall => {
        try {
          if (hall.layout) {
            JSON.parse(hall.layout);
            return true;
          }
          return false;
        } catch {
          return false;
        }
      });
      setHalls(validHalls);
    } catch (error) {
      message.error('Ошибка загрузки залов');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hallsRes, locationsRes] = await Promise.all([
          axios.get('/api/Halls', { headers: { 'Cache-Control': 'no-cache' } }),
          axios.get('/api/Locations', { headers: { 'Cache-Control': 'no-cache' } }),
        ]);
        const validHalls = hallsRes.data.filter(hall => {
          try {
            if (hall.layout) {
              JSON.parse(hall.layout);
              return true;
            }
            return false;
          } catch {
            return false;
          }
        });
        setHalls(validHalls);
        setLocations(locationsRes.data);
      } catch (error) {
        message.error('Ошибка загрузки данных');
      }
    };
    fetchData();
  }, []);

  const handleCreate = async () => {
    await fetchHalls();
    setIsCreateModalVisible(false);
  };

  const handleUpdate = async () => {
    await fetchHalls();
    setUpdateHall(null);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/Halls/${id}`);
      await fetchHalls();
      message.success('Зал удалён');
    } catch (error) {
      message.error('Ошибка удаления зала');
    }
  };

  const showSeats = (hall) => {
    setSelectedHall(hall);
    setIsSeatModalVisible(true);
  };

  const columns = [
    
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Локация',
      dataIndex: 'locationId',
      key: 'locationId',
      render: (locationId) => locations.find((l) => l.id === locationId)?.name || 'Не указана',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button onClick={() => showSeats(record)} style={{ marginRight: 8 }}>
            Показать места
          </Button>
          <Button onClick={() => setUpdateHall(record)} style={{ marginRight: 8 }}>
            Редактировать
          </Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Удалить
          </Button>
        </>
      ),
    },
  ];

  if (!user || user.userRole !== 'admin') {
    return <div>Доступ запрещён. Эта страница только для администраторов.</div>;
  }

  let layout = null;
  try {
    layout = selectedHall?.layout ? JSON.parse(selectedHall.layout) : null;
    console.log('Parsed layout:', layout);
  } catch (error) {
    console.error('Ошибка парсинга layout:', error);
  }

  return (
    <div>
      <Button
        type="primary"
        onClick={() => setIsCreateModalVisible(true)}
        style={{ marginBottom: 16 }}
      >
        Добавить зал
      </Button>
      <Table
        dataSource={halls}
        columns={columns}
        rowKey="id"
        locale={{ emptyText: 'Нет залов' }}
      />
      <Modal
        title={`Места в зале: ${selectedHall?.name || ''}`}
        open={isSeatModalVisible}
        onCancel={() => setIsSeatModalVisible(false)}
        footer={null}
        width={1400}
        centered
      >
        {layout && layout.rows && layout.rows.length > 0 ? (
          <SeatGrid rows={layout.rows} mode="view" />
        ) : (
          <div>Схема зала недоступна или пуста</div>
        )}
      </Modal>
      <CreateHall
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onCreate={handleCreate}
      />
      {updateHall && (
        <UpdateHall
          hall={updateHall}
          onCancel={() => setUpdateHall(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default Halls;