import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Spin, Modal, Form, Input, message, List, Select } from 'antd';
import { Link } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const Profile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPhoneModalVisible, setIsPhoneModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isCardsModalVisible, setIsCardsModalVisible] = useState(false);
  const [isAddCardModalVisible, setIsAddCardModalVisible] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [phoneForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [addCardForm] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, ticketsRes, paymentMethodsRes] = await Promise.all([
          axios.get('/api/User/Profile'),
          axios.get(`/api/Tickets/ByAccount/${user.accountId}`),
          axios.get(`/api/AccountPaymentMethods/ByAccount/${user.accountId}`),
        ]);
        setProfile(profileRes.data);
        setTickets(ticketsRes.data);
        setPaymentMethods(paymentMethodsRes.data || []);
      } catch (error) {
        message.error(error.response?.data?.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    if (user.isAuthenticated) {
      fetchData();
    }
  }, [user]);

  const handleUpdatePhone = async (values) => {
    try {
      const response = await axios.post('/api/User/UpdatePhoneNumber', {
        phoneNumber: values.phoneNumber,
      });
      setProfile((prev) => ({ ...prev, phoneNumber: values.phoneNumber }));
      setIsPhoneModalVisible(false);
      phoneForm.resetFields();
      message.success(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.message || 'Ошибка обновления номера телефона');
    }
  };

  const handleChangePassword = async (values) => {
    try {
      const response = await axios.post('/api/User/ChangePassword', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
      message.success(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.message || 'Ошибка смены пароля');
    }
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 11) return value;

    let formatted = '+7';
    if (digits.length > 1) {
      formatted += ` (${digits.slice(1, 4)}`;
    }
    if (digits.length > 4) {
      formatted += `) ${digits.slice(4, 7)}`;
    }
    if (digits.length > 7) {
      formatted += `-${digits.slice(7, 9)}`;
    }
    if (digits.length > 9) {
      formatted += `-${digits.slice(9, 11)}`;
    }
    return formatted;
  };

  const handlePhoneInputChange = (e) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhoneNumber(rawValue);
    phoneForm.setFieldsValue({ phoneNumber: formattedValue });
  };

  const validatePhoneNumber = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Введите номер телефона'));
    }
    const cleanedValue = value.replace(/\s/g, '');
    const phoneRegex = /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
    if (!phoneRegex.test(cleanedValue)) {
      return Promise.reject(new Error('Номер телефона должен быть в формате +7 (XXX) XXX-XX-XX'));
    }
    return Promise.resolve();
  };

  const handleAddPaymentMethod = async (values) => {
    try {
      const paymentData = {
        type: values.type,
        details: values.details,
        accountId: user.accountId,
      };
      const response = await axios.post('/api/AccountPaymentMethods', paymentData);
      setPaymentMethods((prev) => [...prev, response.data]);
      setIsAddCardModalVisible(false);
      message.success('Карта успешно добавлена');
      addCardForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Ошибка добавления карты');
    }
  };

  const handleDeletePaymentMethod = async (methodId) => {
    try {
      await axios.delete(`/api/AccountPaymentMethods/${methodId}`);
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== methodId));
      message.success('Карта удалена');
    } catch (error) {
      message.error(error.response?.data?.message || 'Ошибка удаления карты');
    }
  };

  if (!user.isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Title level={2}>Профиль</Title>
        <Text>Пожалуйста, авторизируйтесь, чтобы просматривать профиль.</Text>
        <br />
        <Button type="primary" style={{ marginTop: '16px' }}>
          <Link to="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2}>Профиль пользователя</Title>

      {/* Основная информация */}
      <Card style={{ marginBottom: '16px' }}>
        <Text strong>Имя пользователя: </Text>
        <Text>{profile?.userName}</Text>
        <br />
        <Text strong>Электронная почта: </Text>
        <Text>{profile?.email}</Text>
        <br />
        {profile?.phoneNumber ? (
          <>
            <Text strong>Номер телефона: </Text>
            <Text>{profile.phoneNumber}</Text>
            <Button
              type="link"
              onClick={() => setIsPhoneModalVisible(true)}
              style={{ marginLeft: '10px' }}
            >
              Изменить
            </Button>
          </>
        ) : (
          <>
            <Text strong>Номер телефона: </Text>
            <Text type="secondary">Не указан</Text>
            <Button
              type="primary"
              onClick={() => setIsPhoneModalVisible(true)}
              style={{ marginLeft: '10px' }}
            >
              Добавить номер телефона
            </Button>
          </>
        )}
      </Card>

      {/* Кнопки для смены пароля и управления картами */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Button
          type="primary"
          onClick={() => setIsPasswordModalVisible(true)}
        >
          Поменять пароль
        </Button>
        <Button
          type="primary"
          onClick={() => setIsCardsModalVisible(true)}
        >
          Мои карты
        </Button>
      </div>

      {/* Список билетов */}
      <Title level={3}>Мои билеты</Title>
      {tickets.length === 0 ? (
        <Text>У вас пока нет купленных билетов.</Text>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tickets.map((ticket) => (
            <Card key={ticket.id} style={{ width: '100%' }}>
              <Title level={4}>{ticket.event?.title || 'Событие не указано'}</Title>
              <Text strong>Дата события: </Text>
              <Text>{ticket.event?.date ? new Date(ticket.event.date).toLocaleString('ru-RU') : 'Не указана'}</Text>
              <br />
              <Text strong>Локация: </Text>
              <Text>
                {ticket.event?.location?.name || 'Не указана'},{' '}
                {ticket.event?.location?.city?.title || 'Не указан'}
              </Text>
              <br />
              {ticket.ticketPlaces && ticket.ticketPlaces.length > 0 ? (
                <>
                  <Text strong>Места: </Text>
                  <Text>
                    {ticket.ticketPlaces
                      .map(
                        (tp) =>
                          `Ряд ${tp.place?.rowNumber || 'N/A'}, Место ${
                            tp.place?.seatNumber || 'N/A'
                          } (${(tp.actualPrice != null ? tp.actualPrice : 0).toFixed(2)} руб.)`
                      )
                      .join('; ')}
                  </Text>
                </>
              ) : ticket.ticketType ? (
                <>
                  <Text strong>Категория билета: </Text>
                  <Text>
                    {ticket.ticketType.name} (
                    {(ticket.orderAmount != null ? ticket.orderAmount : 0).toFixed(2)} руб.)
                  </Text>
                </>
              ) : (
                <>
                  <Text strong>Тип: </Text>
                  <Text>
                    Фиксированная цена (
                    {(ticket.orderAmount != null ? ticket.orderAmount : 0).toFixed(2)} руб.)
                  </Text>
                </>
              )}
              <br />
              <Text strong>Дата покупки: </Text>
              <Text>{ticket.date ? new Date(ticket.date).toLocaleString('ru-RU') : 'Не указана'}</Text>
              <br />
              <Text strong>Сумма покупки: </Text>
              <Text>{(ticket.orderAmount != null ? ticket.orderAmount : 0).toFixed(2)} руб.</Text>
              <br />
              <Text strong>Сумма скидки: </Text>
              <Text>{(ticket.discountAmount != null ? ticket.discountAmount : 0).toFixed(2)} руб.</Text>
              <br />
              {ticket.promoCode && (
                <>
                  <Text strong>Промокод: </Text>
                  <Text>{ticket.promoCode.title}</Text>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Модальное окно для добавления/изменения номера телефона */}
      <Modal
        title="Укажите номер телефона"
        open={isPhoneModalVisible}
        onCancel={() => {
          setIsPhoneModalVisible(false);
          phoneForm.resetFields();
        }}
        footer={null}
      >
        <Form form={phoneForm} layout="vertical" onFinish={handleUpdatePhone}>
          <Form.Item
            name="phoneNumber"
            label="Номер телефона"
            rules={[{ validator: validatePhoneNumber }]}
            initialValue="+7"
          >
            <Input
              placeholder="+7 (XXX) XXX-XX-XX"
              onChange={handlePhoneInputChange}
              maxLength={18}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Сохранить
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно для смены пароля */}
      <Modal
        title="Смена пароля"
        open={isPasswordModalVisible}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="oldPassword"
            label="Старый пароль"
            rules={[{ required: true, message: 'Введите старый пароль' }]}
          >
            <Input.Password placeholder="Введите старый пароль" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Новый пароль"
            rules={[
              { required: true, message: 'Введите новый пароль' },
              { min: 6, message: 'Пароль должен содержать минимум 6 символов' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                message: 'Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву и одну цифру',
              },
            ]}
          >
            <Input.Password placeholder="Введите новый пароль" />
          </Form.Item>
          <Form.Item
            name="confirmNewPassword"
            label="Повторите новый пароль"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Повторите новый пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Пароли не совпадают'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Повторите новый пароль" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Сменить пароль
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно для управления картами */}
      <Modal
        title="Мои карты"
        open={isCardsModalVisible}
        onCancel={() => setIsCardsModalVisible(false)}
        footer={[
          <Button
            key="add"
            type="primary"
            onClick={() => setIsAddCardModalVisible(true)}
          >
            Добавить карту
          </Button>,
          <Button
            key="close"
            onClick={() => setIsCardsModalVisible(false)}
          >
            Закрыть
          </Button>,
        ]}
      >
        {paymentMethods.length === 0 ? (
          <Text>У вас пока нет добавленных карт.</Text>
        ) : (
          <List
            dataSource={paymentMethods}
            renderItem={(method) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    danger
                    onClick={() => handleDeletePaymentMethod(method.id)}
                  >
                    Удалить
                  </Button>,
                ]}
              >
                <Text>
                  {method.type} - {method.maskedDetails}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* Модальное окно для добавления новой карты */}
      <Modal
        title="Добавить новую карту"
        open={isAddCardModalVisible}
        onCancel={() => {
          setIsAddCardModalVisible(false);
          addCardForm.resetFields();
        }}
        footer={null}
      >
        <Form form={addCardForm} layout="vertical" onFinish={handleAddPaymentMethod}>
          <Form.Item
            name="type"
            label="Тип карты"
            rules={[{ required: true, message: 'Выберите тип карты' }]}
            initialValue="CreditCard"
          >
            <Select>
              <Option value="CreditCard">Кредитная карта</Option>
              <Option value="DebitCard">Дебетовая карта</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="details"
            label="Номер карты"
            rules={[
              { required: true, message: 'Введите номер карты' },
              {
                pattern: /^\d{16}$/,
                message: 'Номер карты должен состоять из 16 цифр',
              },
            ]}
          >
            <Input placeholder="1234 5678 9012 3456" maxLength={16} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Добавить
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;