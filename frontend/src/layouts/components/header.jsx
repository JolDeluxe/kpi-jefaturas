import { useEffect, useState } from 'react';
import HeaderDesktop from './header-desktop.jsx';
import HeaderMobile from './header-mobile.jsx';

export default function Header({ user }) {
  const [isLargeScreen, setIsLargeScreen] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  return isLargeScreen ? <HeaderDesktop user={user} /> : <HeaderMobile user={user} />;
}
