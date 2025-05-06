import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import axios from 'axios';

const UpdateCity = ({ city, onCancel, onUpdate }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      title: city.title,
    });
  }, [city, form]);

  const handleSubmit = async (values) => {
    try {
      // Формируем полный объект City
      const cityData = {
        id: city.id,
        title: values.title,
      };

      const response = await axios.put(`/api/Cities/${city.id}`, cityData);
      onUpdate(response.data);
      message.success('Город обновлён');
    } catch (error) {
      // Выводим точное сообщение об ошибке от сервера
      const errorMessage = error.response?.data?.message || 'Ошибка обновления города';
      console.error('Ошибка сервера:', error.response?.data);
      message.error(errorMessage);
    }
  };

  return (
    <Modal
      title="Редактировать город"
      open={!!city}
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

export default UpdateCity;