import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, InputNumber, message, ColorPicker } from 'antd';
import axios from 'axios';
import SeatGrid from './SeatGrid';
import './SeatGrid.css';
import './CreateHall.css';

const { Option } = Select;

const CreateHall = ({ open, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [locations, setLocations] = useState([]);
  const [rows, setRows] = useState([]);
  const [currentRowNumber, setCurrentRowNumber] = useState('');
  const [currentSeatCount, setCurrentSeatCount] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(10);
  const [currentColor, setCurrentColor] = useState('#1677ff');
  const [previewRows, setPreviewRows] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get('/api/Locations', {
          headers: { 'Cache-Control': 'no-cache' },
        });
        setLocations(response.data);
        console.log('Locations fetched:', response.data);
      } catch (error) {
        message.error('Ошибка загрузки локаций');
        console.error('Locations fetch error:', error);
      }
    };
    fetchLocations();
  }, []);

  const addRow = () => {
    if (!currentRowNumber) {
      message.error('Введите номер ряда');
      return;
    }
    if (rows.some(r => r.rowNumber === currentRowNumber)) {
      message.error('Номер ряда должен быть уникальным');
      return;
    }
    if (currentSeatCount < 1) {
      message.error('Количество мест должно быть больше 0');
      return;
    }
    if (currentPrice < 0) {
      message.error('Цена не может быть отрицательной');
      return;
    }

    const newRow = {
      rowNumber: currentRowNumber,
      count: currentSeatCount,
      seats: Array.from({ length: currentSeatCount }, (_, i) => ({
        seatNumber: i + 1,
        price: Number(currentPrice),
        color: currentColor,
      })),
    };

    setRows(prev => [...prev, newRow]);
    setCurrentRowNumber('');
    setCurrentSeatCount(1);
    setCurrentPrice(10);
    setCurrentColor('#1677ff');
  };

  const handlePreview = () => {
    let previewData = rows;
    if (currentRowNumber && currentSeatCount >= 1 && !rows.some(r => r.rowNumber === currentRowNumber)) {
      const tempRow = {
        rowNumber: currentRowNumber,
        count: currentSeatCount,
        seats: Array.from({ length: currentSeatCount }, (_, i) => ({
          seatNumber: i + 1,
          price: Number(currentPrice),
          color: currentColor,
        })),
      };
      previewData = [...rows, tempRow];
    }
    if (previewData.length === 0) {
      message.error('Добавьте хотя бы один ряд для предпросмотра');
      return;
    }
    setPreviewRows(previewData);
    setPreviewMode(true);
    console.log('Preview rows:', previewData);
  };

  const handleSubmit = async (values) => {
    if (rows.length === 0) {
      message.error('Добавьте хотя бы один ряд');
      return;
    }

    try {
      const layout = { rows: rows };
      const hallData = {
        name: values.name,
        locationId: values.locationId,
        layout: JSON.stringify(layout),
      };

      console.log('Отправляемый hallData:', JSON.stringify(hallData, null, 2));

      message.loading('Создание зала...', 0);
      const response = await axios.post('/api/Halls', hallData, {
        headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'application/json' },
      });
      console.log('Ответ сервера:', response.data);

      message.destroy();
      message.success('Зал создан');
      onCreate();
      form.resetFields();
      setRows([]);
      setCurrentRowNumber('');
      setCurrentSeatCount(1);
      setCurrentPrice(10);
      setCurrentColor('#1677ff');
      setPreviewRows([]);
      setPreviewMode(false);
    } catch (error) {
      message.destroy();
      console.error('Ошибка создания зала:', error.response?.data || error.message);
      message.error(error.response?.data?.message || 'Ошибка создания зала');
    }
  };

  return (
    <Modal
      title="Создать зал"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1400}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="form-container"
      >
        <div className="form-section">
          <Form.Item
            name="name"
            label="Название зала"
            rules={[{ required: true, message: 'Введите название зала' }]}
            className="form-item"
          >
            <Input className="form-input" />
          </Form.Item>
          <Form.Item
            name="locationId"
            label="Локация"
            rules={[{ required: true, message: 'Выберите локацию' }]}
            className="form-item"
          >
            <Select className="form-input">
              {locations.map((location) => (
                <Option key={location.id} value={location.id}>
                  {location.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>
        <div className="row-inputs">
          <h3 className="section-title">Создание схемы зала</h3>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">Номер ряда:</label>
              <Input
                value={currentRowNumber}
                onChange={(e) => setCurrentRowNumber(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Количество мест:</label>
              <InputNumber
                min={1}
                value={currentSeatCount}
                onChange={(value) => setCurrentSeatCount(value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Цена (₽):</label>
              <InputNumber
                min={0}
                value={currentPrice}
                onChange={(value) => setCurrentPrice(value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Цвет:</label>
              <ColorPicker
                value={currentColor}
                onChange={(color) => setCurrentColor(color.toHexString())}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <Button onClick={addRow} className="action-button">
              Добавить ряд
            </Button>
            <Button onClick={handlePreview} className="action-button">
              Предпросмотр
            </Button>
          </div>
        </div>
        {previewMode && previewRows.length > 0 && (
          <div className="preview-container">
            <h3 className="section-title">Предпросмотр схемы зала</h3>
            <SeatGrid rows={previewRows} mode="view" />
            <Button
              onClick={() => setPreviewMode(false)}
              className="close-preview-button"
            >
              Закрыть предпросмотр
            </Button>
          </div>
        )}
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Создать зал
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateHall;