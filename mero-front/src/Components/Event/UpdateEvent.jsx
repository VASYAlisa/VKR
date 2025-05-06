import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, InputNumber, message } from 'antd';
import axios from 'axios';
import moment from 'moment';
import TicketTypeForm from './TicketTypeForm';

const { Option } = Select;

const UpdateEvent = ({ event, onCancel, onUpdate }) => {
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
        const [locationsRes, categoriesRes, ticketTypesRes] = await Promise.all([
          axios.get('/api/Locations'),
          axios.get('/api/Categories'),
          axios.get(`/api/Events/${event.id}/TicketTypes`),
        ]);
        setLocations(locationsRes.data);
        setCategories(categoriesRes.data);
        setTicketTypes(ticketTypesRes.data);

        // Определяем тип события
        if (event.hallId) {
          setEventType('hall');
          setSelectedLocationId(event.locationId);
        } else if (ticketTypesRes.data.length > 0) {
          setEventType('ticketTypes');
          setSelectedLocationId(event.locationId);
        } else {
          setEventType('fixed');
          setSelectedLocationId(event.locationId);
        }

        // Заполняем форму текущими данными
        form.setFieldsValue({
          title: event.title,
          basePrice: event.basePrice,
          maxTickets: event.maxTickets,
          date: event.date ? moment(event.date) : null,
          description: event.description,
          image: event.image,
          locationId: event.locationId,
          hallId: event.hallId,
          categoryIds: event.categories ? event.categories.map((c) => c.id) : [],
        });
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        message.error('Ошибка загрузки данных');
      }
    };
    fetchData();
  }, [event, form]);

  useEffect(() => {
    const fetchHalls = async () => {
      if (selectedLocationId) {
        try {
          const response = await axios.get(`/api/Halls?locationId=${selectedLocationId}`);
          setHalls(response.data);
        } catch (error) {
          console.error('Ошибка загрузки залов:', error);
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
      // Формируем данные для отправки на сервер
      const eventData = {
        title: values.title || event.title,
        basePrice: eventType === 'fixed' ? parseInt(values.basePrice) : null,
        maxTickets: eventType === 'fixed' ? (values.maxTickets ? parseInt(values.maxTickets) : null) : null,
        date: values.date ? values.date.toISOString() : event.date,
        description: values.description || event.description,
        image: values.image || event.image,
        locationId: values.locationId || event.locationId,
        hallId: eventType === 'hall' ? values.hallId : null,
        categoryIds: values.categoryIds || (event.categories ? event.categories.map((c) => c.id) : []),
      };

      // Обновляем событие
      await axios.put(`/api/Events/${event.id}`, eventData);

      // Синхронизируем типы билетов
      if (eventType === 'ticketTypes') {
        const existingTicketTypes = await axios.get(`/api/Events/${event.id}/TicketTypes`);
        for (const tt of existingTicketTypes.data) {
          await axios.delete(`/api/TicketTypes/${tt.id}`);
        }
        for (const ticketType of ticketTypes) {
          await axios.post('/api/TicketTypes', {
            name: ticketType.name,
            price: ticketType.price,
            maxAvailable: ticketType.maxAvailable,
            eventId: event.id,
          });
        }
      }

      // Загружаем полные данные события с сервера
      const response = await axios.get(`/api/Events/${event.id}`);
      const serverEvent = response.data;

      // Формируем обновленный объект события
      const updatedEvent = {
        id: event.id,
        title: values.title || event.title,
        basePrice: eventType === 'fixed' ? parseInt(values.basePrice) : null,
        maxTickets: eventType === 'fixed' ? (values.maxTickets ? parseInt(values.maxTickets) : null) : null,
        date: values.date ? values.date.toISOString() : event.date,
        description: values.description || event.description,
        image: values.image || event.image,
        locationId: values.locationId || event.locationId,
        hallId: eventType === 'hall' ? values.hallId : null,
        location: locations.find((loc) => loc.id === (values.locationId || event.locationId)) || event.location,
        categories: categories.filter((cat) => (values.categoryIds || event.categories?.map((c) => c.id))?.includes(cat.id)) || event.categories,
        ticketTypes: eventType === 'ticketTypes' ? ticketTypes : [],
        ...serverEvent, // Включаем дополнительные данные с сервера
      };

      console.log('Формируемый updatedEvent:', updatedEvent);

      onUpdate(updatedEvent);
      form.resetFields();
      setTicketTypes([]);
      setSelectedLocationId(null);
      message.success('Событие обновлено');
    } catch (error) {
      console.error('Ошибка в handleSubmit:', error);
      message.error(error.response?.data?.message || 'Ошибка обновления события');
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
            <TicketTypeForm
              ticketTypes={ticketTypes}
              setTicketTypes={setTicketTypes}
              isEditing={true}
              eventId={event.id}
            />
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
      title="Редактировать событие"
      open={!!event}
      onCancel={() => {
        form.resetFields();
        setTicketTypes([]);
        setSelectedLocationId(null);
        onCancel();
      }}
      footer={null}
      width={eventType === 'ticketTypes' ? 1000 : 600}
    >
      {eventType && (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
              Обновить
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default UpdateEvent;