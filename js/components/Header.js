define(['Base/Component', 'css!Comp/Header/style'], function (Component) {
    'use strict';

    class Header extends Component {
        render({title, description}) {
            return `
            <header class="header">
               <h1 class="header__title">${title}</h1>
               <p class="header__description">${description}</p>
            </header>`;
        }
    }

    return Header;
});