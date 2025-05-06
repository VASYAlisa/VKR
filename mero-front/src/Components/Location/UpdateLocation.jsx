import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import axios from 'axios';

const { Option } = Select;

const UpdateLocation = ({ location, onCancel, onUpdate }) => {
  const [form] = Form.useForm();
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get('/api/Cities');
        setCities(response.data);
      } catch (error) {
        message.error('Ошибка загрузки городов');
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      name: location.name,
      cityId: location.cityId,
    });
  }, [location, form]);

  const handleSubmit = async (values) => {
    try {
      const response = await axios.put(`/api/Locations/${location.id}`, values);
      onUpdate(response.data);
      message.success('Локация обновлена');
    } catch (error) {
      message.error('Ошибка обновления локации');
    }
  };

  return (
    <Modal
      title="Редактировать локацию"
      open={!!location}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Название"
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="cityId"
          label="Город"
          rules={[{ required: true, message: 'Выберите город' }]}
        >
          <Select>
            {cities.map((city) => (
              <Option key={city.id} value={city.id}>
                {city.title}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Обновить
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateLocation;