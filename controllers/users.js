const User = require('../models/user');
const randomColor = require('randomcolor');
const MoneyBox = require('../models/money_parts');



module.exports.renderRegister = async (req, res) => {
    let boxes = await MoneyBox.find({});
    res.render('users/register',{boxes});
}

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password,keyword,moneyBox} = req.body;
        let user;
        if(keyword == "administracionAlta"){
            user = new User({ email, username,moneyBox, role:"directAdmin",color:"#00FF00"});
        }
        if(keyword == "administracion1" || keyword == "cajaAbasolo"){
            user = new User({ email, username,moneyBox, role:"caja",color:"#00DDAA"});
        }
        if(keyword == "enfermeria"){
            user = new User({ email, username,moneyBox, role:"nurse",color:"#00FF00"});
        }
        if(keyword == "MedicoAbasolo"){
            user = new User({ email, username,moneyBox, role:"medico",color: randomColor({luminosity:'light'})});
        }
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Bienvenido!');
            res.redirect('/services');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}

module.exports.updateStockLocation =  async (req, res, next) => {
    console.log(currentUser.id)
    updatedStockLocation = req.body.stockLocation;
    console.log('update stock location');
    console.log(updatedStockLocation)
    user = await User.findByIdAndUpdate(currentUser.id, { stockLocation: updatedStockLocation });
    res.send({ msg: "True"});
}

module.exports.updateMoneyBox =  async (req, res, next) => {
    console.log('update Money Box!!!!')
    updatedMoneyBox = await MoneyBox.findById(req.body.moneyBoxId);
    console.log('caja de dinero actualizada');
    console.log(updatedMoneyBox);
    user = await User.findByIdAndUpdate(currentUser.id, { moneyBox: updatedMoneyBox });
    res.send({ msg: "True"});
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash('success', `Bienvenido ${req.user.username}`);
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout();
    // req.session.destroy();
    req.flash('success', "Hasta pronto!");
    res.redirect('/');
}