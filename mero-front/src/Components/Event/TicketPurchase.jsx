import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button,  Form,  Select,  Input,  message,  Typography,  Card,  List,  Modal,  Spin,  InputNumber,} from 'antd';
import axios from 'axios';
import SeatGrid from '../Halls/SeatGrid';

const { Title, Text } = Typography;
const { Option } = Select;

const TicketPurchase = ({ user }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [event, setEvent] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [promoCode, setPromoCode] = useState(null);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [hallLayout, setHallLayout] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAddPaymentModalVisible, setIsAddPaymentModalVisible] = useState(false);
  const [isPaymentConfirmModalVisible, setIsPaymentConfirmModalVisible] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, paymentMethodsRes] = await Promise.all([
          axios.get(`/api/Events/${eventId}`),
          axios.get(`/api/AccountPaymentMethods/ByAccount/${user.accountId}`),
        ]);
        setEvent(eventRes.data);
        setPaymentMethods(paymentMethodsRes.data || []);

        if (eventRes.data.hallId) {
          const layoutRes = await axios.get(`/api/Places/ByHall/${eventRes.data.hallId}`);
          setHallLayout(layoutRes.data);
        }

        setLoading(false);
      } catch (error) {
        message.error(error.response?.data || 'Ошибка загрузки данных');
        setLoading(false);
      }
    };
    if (user.isAuthenticated) {
      fetchData();
    } else {
      navigate('/login');
    }
  }, [eventId, user, navigate]);

  useEffect(() => {
    calculateTotal();
  }, [event, selectedPlaces, promoCode, form]);

  const handlePromoCodeCheck = async (value) => {
    if (!value) {
      setPromoCode(null);
      return;
    }
    try {
      const response = await axios.get(`/api/PromoCodes/ByTitle/${value}`);
      if (response.data.eventId !== parseInt(eventId)) {
        message.error('Промокод не применим к этому событию');
        setPromoCode(null);
      } else if (!response.data.isActive || new Date(response.data.validUntil) < new Date()) {
        message.error('Промокод недействителен');
        setPromoCode(null);
      } else {
        setPromoCode(response.data);
        message.success('Промокод применён');
      }
    } catch (error) {
      message.error(error.response?.data || 'Промокод не найден');
      setPromoCode(null);
    }
  };

  const calculateTotal = () => {
    let price = 0;
    if (event?.hallId && selectedPlaces.length > 0) {
      price = selectedPlaces.reduce((sum, place) => sum + place.price, 0);
    } else if (event?.ticketTypes?.length > 0) {
      const ticketTypeId = form.getFieldValue('ticketTypeId');
      const ticketType = event.ticketTypes.find((tt) => tt.id === ticketTypeId);
      price = ticketType ? ticketType.price : 0;
    } else if (event?.basePrice) {
      price = event.basePrice;
    }

    setOriginalPrice(price);
    if (promoCode) {
      if (promoCode.discountType === 'Percentage') {
        price = price * (1 - promoCode.discountValue / 100);
      } else if (promoCode.discountType === 'Fixed') {
        price = Math.max(0, price - promoCode.discountValue);
      } else {
        message.warning('Неверный тип скидки в промокоде');
      }
    }
    setTotalPrice(price);
  };

  const handlePlaceSelect = (seat) => {
    setSelectedPlaces((prev) => {
      const exists = prev.some((p) => p.id === seat.id);
      if (exists) {
        return prev.filter((p) => p.id !== seat.id);
      } else {
        return [
          ...prev,
          {
            id: seat.id,
            rowNumber: seat.rowNumber,
            seatNumber: seat.seatNumber,
            price: seat.price,
          },
        ];
      }
    });
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
      form.setFieldsValue({ paymentMethodId: response.data.id });
      setIsAddPaymentModalVisible(false);
      message.success('Способ оплаты добавлен');
      paymentForm.resetFields();
    } catch (error) {
      message.error(error.response?.data || 'Ошибка добавления способа оплаты');
    }
  };

  const handlePaymentMethodChange = (value) => {
    if (value === 'new') {
      setIsAddPaymentModalVisible(true);
    } else {
      setSelectedPaymentMethod(
        paymentMethods.find((pm) => pm.id === value) || null
      );
    }
  };

  const handleSubmit = (values) => {
    if (event.hallId && selectedPlaces.length === 0) {
      message.error('Выберите хотя бы одно место');
      return;
    }
    setIsPaymentConfirmModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    const values = form.getFieldsValue();
    setIsProcessingPayment(true);

    // Имитация процесса оплаты (3 секунды)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const ticketData = {
        eventId: parseInt(eventId),
        ticketTypeId: values.ticketTypeId || null,
        placeIds: selectedPlaces.map((p) => p.id),
        promoCodeId: promoCode ? promoCode.id : null,
        accountId: user.accountId,
        paymentMethodId: values.paymentMethodId,
      };
      const response = await axios.post('/api/Tickets', ticketData);
      message.success('Билет успешно куплен!');
      setIsPaymentConfirmModalVisible(false);
      navigate('/tickets', { state: { refresh: true } });
    } catch (error) {
      message.error(error.response?.data || 'Ошибка покупки билета');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!event) {
    return <div>Событие не найдено</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2}>Оформление билета на "{event.title}"</Title>
      <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={calculateTotal}>
        <Card style={{ marginBottom: '16px' }}>
          <Text strong>Дата:</Text>{' '}
          {event.date ? new Date(event.date).toLocaleString('ru-RU') : 'Не указана'} <br />
          <Text strong>Локация:</Text> {event.location?.name}, {event.location?.city?.title}
        </Card>

        {event.hallId && hallLayout ? (
          <>
            <Title level={4}>Выбор мест</Title>
            <SeatGrid
              rows={hallLayout.rows
                .sort((a, b) => parseInt(a.rowNumber) - parseInt(b.rowNumber))
                .map((row) => ({
                  ...row,
                  seats: row.seats.map((seat) => ({
                    ...seat,
                    rowNumber: row.rowNumber,
                  })),
                }))}
              mode="select"
              selectedSeats={selectedPlaces}
              onSelectSeat={handlePlaceSelect}
            />
            {selectedPlaces.length > 0 && (
              <List
                header={<Text strong>Выбранные места:</Text>}
                dataSource={selectedPlaces}
                renderItem={(place) => (
                  <List.Item>
                    Ряд {place.rowNumber}, Место {place.seatNumber} - {place.price} руб.
                  </List.Item>
                )}
              />
            )}
          </>
        ) : event.ticketTypes?.length > 0 ? (
          <Form.Item
            name="ticketTypeId"
            label="Категория билета"
            rules={[{ required: true, message: 'Выберите категорию билета' }]}
          >
            <Select>
              {event.ticketTypes.map((tt) => (
                <Option
                  key={tt.id}
                  value={tt.id}
                  disabled={tt.maxAvailable && tt.soldCount >= tt.maxAvailable}
                >
                  {tt.name} - {tt.price} руб.{' '}
                  {tt.maxAvailable && tt.soldCount >= tt.maxAvailable ? '(Нет мест)' : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          <Card style={{ marginBottom: '16px' }}>
            <Text strong>Цена билета:</Text> {event.basePrice} руб.
          </Card>
        )}

        <Form.Item label="Промокод">
          <Input.Search
            placeholder="Введите промокод"
            onSearch={handlePromoCodeCheck}
            enterButton="Применить"
          />
        </Form.Item>

        {paymentMethods.length === 0 && !isAddPaymentModalVisible ? (
          <Card style={{ marginBottom: '16px' }}>
            <Text type="warning">
              У вас нет добавленных способов оплаты. Пожалуйста, добавьте способ оплаты.
            </Text>
            <Button
              type="primary"
              onClick={() => setIsAddPaymentModalVisible(true)}
              style={{ marginTop: '8px' }}
            >
              Добавить способ оплаты
            </Button>
          </Card>
        ) : (
          <Form.Item
            name="paymentMethodId"
            label="Способ оплаты"
            rules={[{ required: true, message: 'Выберите способ оплаты' }]}
          >
            <Select placeholder="Выберите способ оплаты" onChange={handlePaymentMethodChange}>
              {paymentMethods.map((pm) => (
                <Option key={pm.id} value={pm.id}>
                  {pm.type} - {pm.maskedDetails}
                </Option>
              ))}
              <Option key="new" value="new">
                Другая карта
              </Option>
            </Select>
          </Form.Item>
        )}

        <Card style={{ marginBottom: '16px' }}>
          <Text strong>Итоговая сумма:</Text> {totalPrice.toFixed(2)} руб. <br />
          {promoCode && (
            <Text type="success">Скидка: {(originalPrice - totalPrice).toFixed(2)} руб.</Text>
          )}
        </Card>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            disabled={paymentMethods.length === 0 && !isAddPaymentModalVisible}
          >
            Купить билет
          </Button>
        </Form.Item>
      </Form>

      {/* Модальное окно для добавления нового способа оплаты */}
      <Modal
        title="Добавить новый способ оплаты"
        open={isAddPaymentModalVisible}
        onCancel={() => {
          setIsAddPaymentModalVisible(false);
          paymentForm.resetFields();
        }}
        footer={null}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleAddPaymentMethod}>
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

      {/* Модальное окно для подтверждения оплаты */}
      <Modal
        title="Подтверждение оплаты"
        open={isPaymentConfirmModalVisible}
        onCancel={() => setIsPaymentConfirmModalVisible(false)}
        footer={null}
        closable={!isProcessingPayment}
      >
        {isProcessingPayment ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <Text style={{ display: 'block', marginTop: '16px' }}>
              Обработка платежа...
            </Text>
          </div>
        ) : (
          <Form layout="vertical" onFinish={handleConfirmPayment}>
            <Text strong>Способ оплаты:</Text>
            <Text>
              {' '}
              {selectedPaymentMethod
                ? `${selectedPaymentMethod.type} - ${selectedPaymentMethod.maskedDetails}`
                : 'Не выбран'}
            </Text>
            <Form.Item
              name="cvv"
              label="CVV"
              rules={[
                { required: true, message: 'Введите CVV' },
                {
                  pattern: /^\d{3}$/,
                  message: 'CVV должен состоять из 3 цифр',
                },
              ]}
            >
              <InputNumber
                placeholder="123"
                maxLength={3}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="expiry"
              label="Срок действия (MM/YY)"
              rules={[
                { required: true, message: 'Введите срок действия' },
                {
                  pattern: /^(0[1-9]|1[0-2])\/\d{2}$/,
                  message: 'Формат: MM/YY (например, 12/25)',
                },
              ]}
            >
              <Input placeholder="12/25" maxLength={5} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Оплатить
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default TicketPurchase;