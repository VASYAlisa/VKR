import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import axios from 'axios';

const UpdateCategory = ({ category, onCancel, onUpdate }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      title: category.title,
    });
  }, [category, form]);

  const handleSubmit = async (values) => {
    try {
      // Формируем полный объект Category
      const categoryData = {
        id: category.id,
        title: values.title,
      };

      const response = await axios.put(`/api/Categories/${category.id}`, categoryData);
      onUpdate(response.data);
      message.success('Категория обновлена');
    } catch (error) {
      // Выводим точное сообщение об ошибке от сервера
      const errorMessage = error.response?.data?.message || 'Ошибка обновления категории';
      message.error(errorMessage);
    }
  };

  return (
    <Modal
      title="Редактировать категорию"
      open={!!category}
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
            Обновить
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateCategory;