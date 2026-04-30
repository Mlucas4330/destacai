import { Briefcase, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const NavBar = () => {
  return (
    <>
      <Outlet />
      <nav className='flex border-t border-border bg-bg'>
        <NavLink to='/' className='flex flex-col items-center gap-0.5 py-2 px-6 text-xs transition-colors text-accent-text font-semibold'>
          <Briefcase size={18} />
          Jobs
        </NavLink>
        <NavLink to='/config' className='flex flex-col items-center gap-0.5 py-2 px-6 text-xs transition-colors text-accent-text font-semibold'>
          <Settings size={18} />
          Settings
        </NavLink>
      </nav>
    </>
  )
}

export default NavBar