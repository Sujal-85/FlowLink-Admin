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
        <Route path="/signup" exact component={SignupPage} />
        <Route path="/login" exact component={LoginPage} />
        <PrivateRoute path="/home" exact component={FlowLinkHome} />
        <Route path="/onboarding" exact component={OnboardingPage} />
        <Route path="/products" exact component={AddProduct} />
        <Route path="/orders" exact component={OrderPage} />
        <Route path="/finances" exact component={FinancesPage} />
        <Route path="/discounts" exact component={DiscountsPage} />
        <Route path="/discounts/new" exact component={AddDiscount} />
        <Route path="/offers" exact component={OffersPage} />
        <Route path="/offers/new" exact component={AddOfferPage} />
        <Route path="/analytics" exact component={AnalyticsPage} />
        <Route path="/customers" exact component={CustomerPage} />
        <PrivateRoute path="/setting" exact component={Setting} />
        <Route path="/" exact render={() => <Redirect to="/home" />} />
        <Route path="**" component={NotFound} />
      </Switch>
    </Router>
  )
}

// ReactDOM.render(<App />, document.getElementById('app'))
export default App;

//
