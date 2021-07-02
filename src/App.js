import './App.css';
import {Parallax, ParallaxProvider} from 'react-scroll-parallax';
import React from "react";
import {Scroll} from "./components/Scroll/Scroll";
import {Project} from "./components/Project/Project";

const projects = [
    {
        title: 'Social Data',
        text: 'This is a project providing open source social data.',
        image: 'https://jareds-file-sharing.s3.amazonaws.com/social-data.png',
        link: ''
    },
    {
        title: 'Deal or No Deal',
        text: 'Analysis of the greatest game show of all time.',
        image: 'https://jareds-file-sharing.s3.amazonaws.com/tds.png',
        link: ''
    },
    // {
    //     title: 'Title',
    //     text: 'Text text text',
    //     image: 'https://jareds-file-sharing.s3.amazonaws.com/tds.png',
    //     link: ''
    // },
    {
        title: 'Teetum.com',
        text: "This is a joke website I made for my friend's birthday",
        image: 'https://jareds-file-sharing.s3.amazonaws.com/teetum.png',
        link: ''
    },
    {
        title: 'Bigballsannie.com',
        text: "This is another joke website I made for my friend's birthday, only with games",
        image: 'https://jareds-file-sharing.s3.amazonaws.com/bba.png',
        link: ''
    },
]


function App() {
    let items = []

    for (const [i, data] of projects.entries()) {
        items.push(<Project title={data.title} text={data.text} image={data.image} link={data.link} pos={i}></Project>)
    }
    return (
        <ParallaxProvider>
            <div className="App">
                <Scroll/>
                <div className="projects">
                    <Parallax y={[-20, 20]} tagOuter="figure">
                        <h1 className="section-title">PROJECTS</h1>
                    </Parallax>
                    {items}
                </div>
                <div className="publications">
                    <Parallax y={[-20, 20]} tagOuter="figure">
                        <h1 className="section-title">PUBLICATIONS</h1>
                    </Parallax>
                </div>
                <div className="work">
                    <Parallax y={[-20, 20]} tagOuter="figure">
                        <h1 className="section-title">WORK</h1>
                    </Parallax>
                </div>
                <div className="about">
                    <Parallax y={[-20, 20]} tagOuter="figure">
                        <h1 className="section-title">ABOUT</h1>
                    </Parallax>
                </div>
            </div>
        </ParallaxProvider>
    );
}

export default App;
