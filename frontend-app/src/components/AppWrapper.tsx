import React from 'react';
import {Outlet} from "react-router-dom";
import Header from "@/components/Header";

const AppWrapper = () => {
    return (
        <div className={'container my-2 mb-10 px-5 md:px-20'}>
            <Header/>
            <Outlet/>
        </div>
    );
};

export default AppWrapper;