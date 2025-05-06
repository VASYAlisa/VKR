import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigProvider, Modal } from 'antd';

const LogOff = ({ setUser }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const showModal = () => {
    setOpen(true);
  };

  useEffect(() => {
    showModal();
  }, []);

  const logOff = async (event) => {
    event.preventDefault();
    const requestOptions = {
      method: 'POST',
    };
    return await fetch('/api/account/logoff', requestOptions).then((response) => {
      if (response.status === 200) {
        setUser({ isAuthenticated: false, userName: '', userRole: '' });
        setOpen(false);
        navigate('/');
      }
      if (response.status === 401) navigate('/login');
    });
  };

  const handleCancel = () => {
    setOpen(false);
    navigate('/');
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            borderRadius: 8,
            colorTextHeading: '#001529',
            colorPrimary: '#1890ff',
            colorBorder: '#d9d9d9',
          },
          Button: {
            primaryColor: '#fff',
            primaryBg: '#1890ff',
            defaultBorderColor: '#d9d9d9',
            borderRadius: 8,
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
      <Modal
        title=""
        okText="Выход"
        cancelText="Отмена"
        open={open}
        onOk={logOff}
        onCancel={handleCancel}
        okButtonProps={{
          style: { transition: 'all 0.3s ease' },
        }}
        cancelButtonProps={{
          style: { transition: 'all 0.3s ease', borderColor: '#d9d9d9', color: '#001529' },
        }}
      >
        <b style={{ fontSize: 16, color: '#001529' }}>Выполнить выход?</b>
      </Modal>
    </ConfigProvider>
  );
};

export default LogOff;