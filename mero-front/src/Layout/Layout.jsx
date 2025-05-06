import React, { useState } from 'react';
import { Layout, Menu, Input, Avatar, Button, Drawer } from 'antd';
import {
  UserOutlined,
  MenuOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  HeartOutlined,
  FileDoneOutlined,
  EnvironmentOutlined,
  TagOutlined,
  ShopOutlined,
  FileTextOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { BsBuildings } from "react-icons/bs";
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const { Header, Content, Footer } = Layout;
const { Search } = Input;

const LayoutComponent = ({ user, setUser }) => {
  const [visible, setVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setVisible(!visible);
  };

  const isEventDetails = location.pathname.startsWith('/event/');

  const handleSearch = (value) => {
    setSearchValue(value);
    // Перенаправляем на страницу событий с параметром query
    navigate(`/events${value ? `?query=${encodeURIComponent(value)}` : ''}`);
  };

  const handleClear = () => {
    setSearchValue('');
    // Сбрасываем поиск, перенаправляя на /events без query
    if (location.pathname.startsWith('/events')) {
      navigate('/events');
    }
  };

  // Определение элементов меню в зависимости от роли пользователя
  const menuItems = user.isAuthenticated
    ? user.userRole === 'admin'
      ? [
          {
            key: '/events',
            icon: <CalendarOutlined />,
            label: <Link to="/events">События</Link>,
          },
          {
            key: '/cities',
            icon: <BsBuildings />,
            label: <Link to="/cities">Города</Link>,
          },
          {
            key: '/categories',
            icon: <TagOutlined />,
            label: <Link to="/categories">Категории</Link>,
          },
          {
            key: '/locations',
            icon: <EnvironmentOutlined />,
            label: <Link to="/locations">Локации</Link>,
          },
          {
            key: '/halls',
            icon: <ShopOutlined />,
            label: <Link to="/halls">Залы</Link>,
          },
          {
            key: '/promocodes',
            icon: <PercentageOutlined />,
            label: <Link to="/promocodes">Промокоды</Link>,
          },
          //{
          //  key: '/reports',
           // icon: <FileTextOutlined />,
          //  label: <Link to="/reports">Отчеты</Link>,
          //},
        ]
      : [
          {
            key: '/events',
            icon: <CalendarOutlined />,
            label: <Link to="/events">События</Link>,
          },
          {
            key: '/favorites',
            icon: <HeartOutlined />,
            label: <Link to="/favorites">Избранное</Link>,
          },
          {
            key: '/tickets',
            icon: <FileDoneOutlined />,
            label: <Link to="/tickets">Билеты</Link>,
          },
        ]
    : [
        {
          key: '/events',
          icon: <CalendarOutlined />,
          label: <Link to="/events">События</Link>,
        },
        {
          key: '/favorites',
          icon: <HeartOutlined />,
          label: <Link to="/favorites">Избранное</Link>,
        },
        {
          key: '/tickets',
          icon: <FileDoneOutlined />,
          label: <Link to="/tickets">Билеты</Link>,
        },
      ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Drawer
        placement="left"
        closable={false}
        onClose={toggleDrawer}
        open={visible}
        width={200}
        styles={{ body: { padding: 0, background: '#001529' } }} // Замена bodyStyle на styles.body
        style={{ zIndex: 1000 }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Mero</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          defaultSelectedKeys={['/events']}
          defaultOpenKeys={['settings']}
        />
      </Drawer>
      <Layout>
        <Header
          style={{
            position: 'fixed',
            zIndex: 1,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            background: '#001529',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MenuOutlined
              style={{ color: '#fff', fontSize: '20px', marginRight: '10px', cursor: 'pointer' }}
              onClick={toggleDrawer}
            />
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>Mero</div>
            {isEventDetails && (
              <Button
                type="link"
                icon={<ArrowLeftOutlined style={{ color: '#fff' }} />}
                onClick={() => navigate('/events')}
                style={{ color: '#fff', marginRight: '10px' }}
              >
                Назад
              </Button>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Search
              placeholder="Поиск событий"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={() => handleSearch(searchValue)} // Явная обработка Enter
              allowClear={{ clearIcon: <span onClick={handleClear}>✕</span> }}
              style={{ width: 200, marginRight: '20px' }}
            />
            <Avatar
              icon={<UserOutlined />}
              style={{ marginRight: '10px', cursor: 'pointer' }}
              onClick={() => navigate(user.isAuthenticated ? '/profile' : '/login')}
            />
            {user.isAuthenticated ? (
              <Button type="link" style={{ color: '#fff' }}>
                <Link to="/logoff">Выйти</Link>
              </Button>
            ) : (
              <Button type="link" style={{ color: '#fff' }}>
                <Link to="/login">Войти</Link>
              </Button>
            )}
          </div>
        </Header>
        <Content
          style={{
            padding: '0 50px',
            marginTop: 64,
            minHeight: 'calc(100vh - 64px - 64px)',
            background: '#fff',
          }}
        >
          <div style={{ padding: '20px 0' }}>
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', height: 64 }}>
          Mero - афиша событий 2025
        </Footer>
      </Layout>
    </Layout>
  );
};

export default LayoutComponent;