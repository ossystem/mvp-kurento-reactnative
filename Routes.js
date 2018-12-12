import React from 'react'
import { Router, Scene } from 'react-native-router-flux'
import Home from './components/Home.js'
import AppMain from './components/App';

const Routes = () => (
   <Router>
      <Scene key = "root" hideNavBar>
         <Scene key = "home" component = {Home} title = "Home" initial = {true} />
         <Scene key = "app" component = {AppMain} title = "About" />
      </Scene>
   </Router>
)
export default Routes