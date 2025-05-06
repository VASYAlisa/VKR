import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, InputNumber, message } from 'antd';
import axios from 'axios';
import TicketTypeForm from './TicketTypeForm';

const { Option } = Select;

const CreateEvent = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [locations, setLocations] = useState([]);
  const [halls, setHalls] = useState([]);
  const [categories, setCategories] = useState([]);
  const [eventType, setEventType] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationsRes, categoriesRes] = await Promise.all([
          axios.get('/api/Locations'),
          axios.get('/api/Categories'),
        ]);
        setLocations(locationsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        message.error('Ошибка загрузки данных');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchHalls = async () => {
      if (selectedLocationId) {
        try {
          const response = await axios.get(`/api/Halls?locationId=${selectedLocationId}`);
          setHalls(response.data);
        } catch (error) {
          message.error('Ошибка загрузки залов');
        }
      } else {
        setHalls([]);
      }
    };
    fetchHalls();
  }, [selectedLocationId]);

  const handleSubmit = async (values) => {
    if (eventType === 'ticketTypes' && ticketTypes.length === 0) {
      message.error('Добавьте хотя бы один тип билета');
      return;
    }

    try {
      const eventData = {
        title: values.title,
        basePrice: eventType === 'fixed' ? parseInt(values.basePrice) : null,
        maxTickets: eventType === 'fixed' ? (values.maxTickets ? parseInt(values.maxTickets) : null) : null,
        date: values.date ? values.date.toISOString() : null,
        description: values.description || null,
        image: values.image || null,
        locationId: values.locationId,
        hallId: eventType === 'hall' ? values.hallId : null,
        categoryIds: values.categoryIds || [],
      };

      const response = await axios.post('/api/Events', eventData);
      const newEvent = response.data;

      if (eventType === 'ticketTypes' && ticketTypes.length > 0) {
        for (const ticketType of ticketTypes) {
          await axios.post('/api/TicketTypes', {
            name: ticketType.name,
            price: ticketType.price,
            maxAvailable: ticketType.maxAvailable,
            eventId: newEvent.id,
          });
        }
      }

      onCreate(newEvent);
      form.resetFields();
      setEventType(null);
      setTicketTypes([]);
      setSelectedLocationId(null);
      message.success('Событие создано');
    } catch (error) {
      message.error(error.response?.data?.message || 'Ошибка создания события');
    }
  };

  const renderFormFields = () => {
    switch (eventType) {
      case 'fixed':
        return (
          <>
            <Form.Item
              name="basePrice"
              label="Базовая цена"
              rules={[{ required: true, message: 'Введите базовую цену' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="maxTickets" label="Максимальное количество билетов">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </>
        );
      case 'ticketTypes':
        return (
          <Form.Item>
            <TicketTypeForm ticketTypes={ticketTypes} setTicketTypes={setTicketTypes} />
          </Form.Item>
        );
      case 'hall':
        return (
          <Form.Item
            name="hallId"
            label="Зал"
            rules={[{ required: true, message: 'Выберите зал' }]}
          >
            <Select
              disabled={!selectedLocationId}
              placeholder={halls.length === 0 ? 'Нет доступных залов' : 'Выберите зал'}
            >
              {halls.map((hall) => (
                <Option key={hall.id} value={hall.id}>
                  {hall.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title="Создать событие"
      open={open}
      onCancel={() => {
        form.resetFields();
        setEventType(null);
        setTicketTypes([]);
        setSelectedLocationId(null);
        onCancel();
      }}
      footer={null}
      width={eventType === 'ticketTypes' ? 1000 : 600}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="eventType"
          label="Тип события"
          rules={[{ required: true, message: 'Выберите тип события' }]}
        >
          <Select onChange={(value) => setEventType(value)} placeholder="Выберите тип">
            <Option value="fixed">С фиксированной ценой</Option>
            <Option value="ticketTypes">С категориями билетов</Option>
            <Option value="hall">С залом</Option>
          </Select>
        </Form.Item>
        {eventType && (
          <>
            <Form.Item
              name="title"
              label="Название"
              rules={[{ required: true, message: 'Введите название' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="date" label="Дата">
              <DatePicker showTime format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item name="description" label="Описание">
              <Input.TextArea />
            </Form.Item>
            <Form.Item name="image" label="URL изображения">
              <Input />
            </Form.Item>
            <Form.Item
              name="locationId"
              label="Локация"
              rules={[{ required: true, message: 'Выберите локацию' }]}
            >
              <Select onChange={(value) => setSelectedLocationId(value)}>
                {locations.map((location) => (
                  <Option key={location.id} value={location.id}>
                    {location.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="categoryIds" label="Категории">
              <Select mode="multiple" placeholder="Выберите категории">
                {categories.map((category) => (
                  <Option key={category.id} value={category.id}>
                    {category.title}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {renderFormFields()}
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Создать
              </Button>
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default CreateEvent;