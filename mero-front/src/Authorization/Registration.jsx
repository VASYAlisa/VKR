import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Form, Input, ConfigProvider } from 'antd';

const Register = ({ user, setUser }) => {
  const [errorMessages, setErrorMessages] = useState([]);
  const navigate = useNavigate();

  const register = async (values) => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: values.username,
        password: values.password,
        passwordconfirm: values.passwordconfirm,
      }),
    };

    try {
      const response = await fetch('/api/account/register', requestOptions);
      const data = await response.json();

      if (response.ok && data.accountId) {
        setUser({
          isAuthenticated: true,
          userName: data.userName || data.username || values.username,
          userRole: data.userRole || 'user',
          accountId: data.accountId,
        });
        navigate('/');
      } else {
        setErrorMessages(data.errors || [data.message || 'Ошибка регистрации']);
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      setErrorMessages(['Произошла ошибка на сервере']);
    }
  };

  const renderErrorMessage = () =>
    errorMessages.map((error, index) => (
      <div key={index} style={{ color: '#ff4d4f', marginTop: '8px', fontSize: '14px' }}>
        {error}
      </div>
    ));

  return (
    <ConfigProvider
      theme={{
        components: {
          Input: {
            activeBorderColor: '#1890ff',
            hoverBorderColor: '#1890ff',
            inputFontSize: 16,
            borderRadius: 8,
            colorBorder: '#d9d9d9',
          },
          Button: {
            primaryColor: '#fff',
            primaryBg: '#1890ff',
            defaultBorderColor: '#d9d9d9',
            borderRadius: 8,
          },
          Checkbox: {
            colorPrimary: '#1890ff',
            colorBorder: '#d9d9d9',
          },
          Form: {
            labelColor: '#001529',
            labelFontSize: 16,
          },
        },
        token: {
          colorPrimary: '#1890ff',
          colorBorder: '#d9d9d9',
          borderRadius: 8,
          colorText: '#001529',
          fontSize: 16,
        },
      }}
    >
      {user?.isAuthenticated ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 128px)',
            background: '#f0f2f5',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ color: '#001529', fontSize: '20px', marginBottom: '16px' }}>
              Пользователь {user.userName || 'неизвестен'} успешно вошел в систему
            </h3>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 128px)',
            background: '#f0f2f5',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              width: '550px',
            }}
          >
            <h3 style={{ color: '#001529', fontSize: '20px', marginBottom: '24px', textAlign: 'center' }}>
              Регистрация
            </h3>
            <Form
              onFinish={register}
              name="basic"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              initialValues={{ remember: true }}
              autoComplete="off"
            >
              <Form.Item
                label="Имя пользователя"
                name="username"
                rules={[{ required: true, message: 'Пожалуйста, введите ваше имя пользователя!' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Пароль"
                name="password"
                rules={[{ required: true, message: 'Пожалуйста, введите пароль!' }]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                label="Подтверждение"
                name="passwordconfirm"
                rules={[{ required: true, message: 'Пожалуйста, подтвердите пароль!' }]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
                <Checkbox>Запомнить</Checkbox>
                {renderErrorMessage()}
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                >
                  Зарегистрироваться
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      )}
    </ConfigProvider>
  );
};

export default Register;