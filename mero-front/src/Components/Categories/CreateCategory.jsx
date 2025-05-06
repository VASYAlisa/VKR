import React from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import axios from 'axios';

const CreateCategory = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      const response = await axios.post('/api/Categories', values);
      onCreate(response.data);
      form.resetFields();
      message.success('Категория создана');
    } catch (error) {
      message.error('Ошибка создания категории');
    }
  };

  return (
    <Modal
      title="Создать категорию"
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

export default CreateCategory;