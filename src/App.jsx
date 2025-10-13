import React, { useState, useEffect } from 'react';
import Loader from './components/Loader';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom'

import './App.css'
import FlowLinkHome from './pages/Home'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AddProduct from './pages/AddProductPage'
import OrderPage from './pages/OrderPage'
import CustomerPage from './pages/CustomerPage'
import AnalyticsPage from './pages/AnalyticsPage'
import FinancesPage from './pages/FinancesPage'
import DiscountsPage from './pages/DiscountsPage'
import AddDiscount from './components/AddDiscount'
import OffersPage from './pages/OffersPage'
import AddOfferPage from './pages/AddOfferPage'
import NotFound from './pages/not-found'
import Setting from './pages/SettingPage'
import PrivateRoute from './components/PrivateRoute'
import OnboardingPage from './pages/OnboardingPage'

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Simulate a 2-second load time

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }
  return (
    <Router>
      <Switch>
                        <Route component={SignupPage} exact path="/signup" />
        <Route component={LoginPage} exact path="/login" />
                <PrivateRoute component={FlowLinkHome} exact path="/home" />
        <Redirect from="/" to="/home" exact />
        <Route component={OnboardingPage} exact path="/onboarding" />
        <Route component={AddProduct} exact path="/products" />
        <Route component={OrderPage} exact path="/orders" />
        <Route component={FinancesPage} exact path="/finances" />
        <Route component={DiscountsPage} exact path="/discounts" />
        <Route component={AddDiscount} exact path="/discounts/new" />
        <Route component={OffersPage} exact path="/offers" />
        <Route component={AddOfferPage} exact path="/offers/new" />
        <Route component={AnalyticsPage} exact path="/analytics" />
        <Route component={CustomerPage} exact path="/customers" />
        <PrivateRoute component={Setting} exact path="/setting" />
        <Route component={NotFound} path="**" />
        <Redirect to="**" />
      </Switch>
    </Router>
  )
}

// ReactDOM.render(<App />, document.getElementById('app'))
export default App;

//
