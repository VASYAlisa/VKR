import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, DatePicker, InputNumber } from 'antd';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;

const CreatePromoCode = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('/api/Events');
        setEvents(response.data);
      } catch (error) {
        message.error('Ошибка загрузки событий');
      }
    };
    fetchEvents();
  }, []);

  const handleSubmit = async (values) => {
    try {
      const promoCodeData = {
        title: values.title,
        discountType: values.discountType,
        discountValue: values.discountValue,
        maxUsages: values.maxUsages,
        validUntil: values.validUntil.toISOString(),
        eventId: values.eventId,
      };
      const response = await axios.post('/api/PromoCodes', promoCodeData);
      onCreate(response.data);
      form.resetFields();
      message.success('Промокод создан');
    } catch (error) {
      message.error('Ошибка создания промокода');
    }
  };

  return (
    <Modal
      title="Создать промокод"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="title"
          label="Название"
          rules={[{ required: true, message: 'Введите название промокода' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="discountType"
          label="Тип скидки"
          rules={[{ required: true, message: 'Выберите тип скидки' }]}
        >
          <Select>
            <Option value="Percentage">Процент</Option>
            <Option value="Fixed">Фиксированная сумма</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="discountValue"
          label="Размер скидки"
          rules={[{ required: true, message: 'Введите размер скидки' }]}
        >
          <InputNumber min={0} max={100} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="maxUsages"
          label="Максимум использований (оставьте пустым, если не ограничено)"
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="validUntil"
          label="Срок действия"
          rules={[{ required: true, message: 'Выберите срок действия' }]}
        >
          <DatePicker
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < moment().startOf('day')}
          />
        </Form.Item>
        <Form.Item
          name="eventId"
          label="Событие"
          rules={[{ required: true, message: 'Выберите событие' }]}
        >
          <Select>
            {events.map((event) => (
              <Option key={event.id} value={event.id}>
                {event.title}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Создать
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreatePromoCode;