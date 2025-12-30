import React, { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    /* Removed max-width from the nav tag to ensure it touches both edges of the screen */
    <nav className="w-full bg-[#000d1a] px-6 py-4 shadow-md border-b border-white/10">
      {/* Container to keep the links and logo aligned with your page content */}
      <div className="mx-auto flex max-w-350 items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            BeyondChats
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center space-x-12 lg:flex">
          <div className="group relative cursor-pointer">
            <span className="flex items-center text-[15px] font-medium text-white hover:text-[#55ef7c] transition-colors">
              Product <span className="ml-1 text-[10px] opacity-70">▼</span>
            </span>
          </div>
          
          <a href="#" className="text-[15px] font-medium text-white hover:text-[#55ef7c] transition-colors">
            Pricing
          </a>

          <div className="group relative cursor-pointer">
            <span className="flex items-center text-[15px] font-medium text-[#55ef7c]">
              Resources <span className="ml-1 text-[10px] opacity-70">▼</span>
            </span>
          </div>

          <a href="#" className="text-[15px] font-medium text-white hover:text-[#55ef7c] transition-colors">
            Contact Us
          </a>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="text-white lg:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden mt-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          <a href="#" className="block text-white px-2">Product</a>
          <a href="#" className="block text-white px-2">Pricing</a>
          <a href="#" className="block text-[#55ef7c] px-2 font-semibold">Resources</a>
          <a href="#" className="block text-white px-2">Contact Us</a>
          <button className="w-full rounded-lg bg-[#55ef7c] py-4 font-bold text-black mt-2">
            Build your free chatbot
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;