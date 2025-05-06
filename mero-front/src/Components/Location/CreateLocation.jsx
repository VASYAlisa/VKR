import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import axios from 'axios';

const { Option } = Select;

const CreateLocation = ({ open, onCancel, onCreate }) => {
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

  const handleSubmit = async (values) => {
    try {
      const response = await axios.post('/api/Locations', values);
      onCreate(response.data);
      form.resetFields();
      message.success('Локация создана');
    } catch (error) {
      message.error('Ошибка создания локации');
    }
  };

  return (
    <Modal
      title="Создать локацию"
      open={open}
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
            Создать
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateLocation;