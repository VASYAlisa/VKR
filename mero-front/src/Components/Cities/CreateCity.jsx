import React from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import axios from 'axios';

const CreateCity = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    console.log('Отправляемые данные:', values); // Логируем данные
    try {
      const response = await axios.post('/api/Cities', values);
      onCreate(response.data);
      form.resetFields();
      message.success('Город создан');
    } catch (error) {
      console.error('Ошибка сервера:', error.response?.data); // Логируем ответ сервера
      message.error('Ошибка создания города');
    }
  };

  return (
    <Modal
      title="Создать город"
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="title"
          label="Название"
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input />
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

export default CreateCity;