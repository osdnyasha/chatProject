define(["Base/Component", "css!Comp/AuthPage/style"], function (Component) {
    "use strict";

    // Страница авторизации
    class AuthPage extends Component {
        /**
         * Инициализация компонента
         */
        constructor() {
            // Функция, вызывающая родительский конструктор
            super();
        }

        /**
         * Рендеринг компонента
         * @returns {string}
         */
        render() {
            return `
                <div class="block block--auth">
                    <form id="signForm" class="form-sign" method="POST">
                        <div class="form-sign__title">Авторизация</div>
                        <div class="form-sign__message">
                        </div>
                        <label>
                            <input type="text" name="login" value="" placeholder="Имя пользователя">
                        </label>
                        <label>
                            <input type="password" name="password" value="" placeholder="Пароль">
                        </label>
                        <button type="submit">Войти</button>
                    </form>
                </div>
            `;
        }

        /**
         * Метод, который запускается после того, как компонент отрендерился в DOM
         * @returns {void}
         */
        _afterMount() {
            const formSign = document.getElementById("signForm");
            formSign.addEventListener("submit", this._formSubmit);
        }

        _formSubmit(e) {
            e.preventDefault();
            sessionStorage.setItem("isAutorizated", true);
            location.reload();
        }
    }

    // Создание и возвращение экземпляра
    return AuthPage;
});
