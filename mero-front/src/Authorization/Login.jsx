import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ConfigProvider, Button, Checkbox, Form, Input } from 'antd';

const Login = ({ user, setUser }) => {
  const [errorMessages, setErrorMessages] = useState([]);
  const navigate = useNavigate();

  const logIn = async (values) => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: values.username,
        password: values.password,
        rememberMe: values.remember,
      }),
    };
    try {
      const response = await fetch('/api/account/login', requestOptions);
      const data = await response.json();
      if (response.status === 200 && data.userName && data.accountId) {
        setUser({
          isAuthenticated: true,
          userName: data.userName,
          userRole: data.userRole,
          accountId: data.accountId,
        });
        navigate('/');
      } else {
        if (data && data.errors && Array.isArray(data.errors)) {
          setErrorMessages(data.errors);
        } else if (data && data.message) {
          setErrorMessages([data.message]);
        } else {
          setErrorMessages(['Ошибка входа']);
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessages(['Ошибка сервера']);
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
      {user.isAuthenticated ? (
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
              Пользователь {user.userName} успешно вошел в систему
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
              Вход
            </h3>
            <Form
              onFinish={logIn}
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
                rules={[{ required: true, message: 'Пожалуйста, введите ваш пароль!' }]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
                <Checkbox>Запомнить</Checkbox>
                {renderErrorMessage()}
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Войти
                  </Button>
                  <Button type="link" style={{ color: 'gray', textDecoration: 'underline', background: 'white' }}>
                    <Link to="/register">Зарегистрироваться</Link>
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>
      )}
    </ConfigProvider>
  );
};

export default Login;