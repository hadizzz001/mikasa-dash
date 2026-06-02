"use client"


import { useRouter } from 'next/navigation'
import axios from "axios";
import React, { useState } from "react";
import $ from 'jquery';





const login = () => {
    const router = useRouter()


    if (typeof window !== "undefined") {
        var tabID = sessionStorage.tabID &&
            sessionStorage.closedLastTab !== '2' ?
            sessionStorage.tabID :
            sessionStorage.tabID = Math.random();
        sessionStorage.closedLastTab = '2';
        $(window).on('unload beforeunload', function () {
            sessionStorage.closedLastTab = '1';
        });
    }

    // localStorage.setItem("tabID", tabID);
    // window.dispatchEvent(new Event("storage"));

    async function getData() {
        const res = await fetch("http://localhost:3000/api/login", { cache: 'no-store' });
        if (!res.ok) {
            throw new Error("Failed to fetch data")
        }
        return res.json();
    }


    async function handleEditSubmit() {

        axios
            .patch(`/api/login/6541366999820c954845b8a8`, tabID)
            .then((res) => {
                console.log(res);
            })
            .catch((err) => {
                console.log("Error");
                console.log(err);
            })
    }



    const handleSubmit = async (e) => {
        e.preventDefault();
        const getD = await getData();
        const user = e.target[0].value;
        const pass = e.target[1].value;

        if (getD[0].username == user && getD[0].pass == pass) {
            await handleEditSubmit()
            alert("Success");
            console.log("local tabid = " + tabID)
            console.log("data tabid = " + getD[0].tabid)
            router.push("/")
        }
        else {
            alert("Failed : Please check your login details and try again");
        }

    }







    return (

        <div className="w-full max-w-xs">
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                        Username
                    </label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" name='username' type="text" placeholder="Username" />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input className="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" name='pass' type="password" placeholder="******************" />
                    <p className="text-red-500 text-xs italic">Please choose a password.</p>
                </div>
                <div className="flex items-center justify-between">
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                        Sign In
                    </button>

                </div>
            </form>

        </div>
    );
};

export default login;