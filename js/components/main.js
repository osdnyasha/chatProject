'use strict';
/**
 * Компонент базовый
 * на вход принимает options, которые можно только читать! 
 * имеет внутреннее состояние state, которое может менять
 * имеет 3 хука: mount, update, unmount
 * прехуки выполняются до и после хуков.
 * хуки переопределять нельзя, прехуки не имеют реализации в базе, реализуются при наследовании если необходимо
 */
class Component {
    constructor(options) {
        this.options = {...this.getDefaultOptions(), ...options};
        this.state = {
            isMount: false
        };
        // только для связи с DOM-ом
        this.id = this.generateId();

        // Компоновщик для сбора дерева детей
        this.childrens = factory.create(Composite, { parent: this });

        // для сбора подписок на события и автоматической отписки
        this.handlers = {};
    }


    /**
     * помещает верстку компонента в dom
     * @param {DOMElement} container контейнер в котором строиться верстка, куда поместить
     * @param {String} position insertAdjacentElement позиция куда помесить, до, в, вконец, после
     */
    mount(container, position) {
        // прехук до монтирования        
        this._beforeMount();
        // создаем новый компонент в доме
        const newComponent = document.createElement('div');
        // помещаем туда верстку
        newComponent.innerHTML = this.toString();
        // перекладываем верстку в нужный контейнер
        container.insertAdjacentElement(position || 'beforeend', newComponent.firstElementChild);
        // подчищаем за собой
        newComponent.remove();
        // меняем состояние что компонент смонтирован
        this.setState({ isMount: true });
        // прехук после монтирования
        this._afterMount()
    }

    /**
     * вызываеться при необходимости обновить компонент в верстке
     * пока не реализован, обновляться будет по изменению состояния компонента
     */
    update() {
        this.beforeUpdate();
        this.afterUpdate();
    }

    /**
     * Уничтожения компонента из dom и вообще
     */
    unmount() {
        // выполняем прехуки
        this.beforeUnmount();
        // отписываемся от всех событий
        this.unsubscribeAll();
        // уничтожаем собственный контейнер
        if (this.getContainer()) {
            this.getContainer().remove();
        }
        // уничтожаем детей
        this.unmountChildren()
        // и себя у родителя, если он есть
        if (this.options.parent) {
            this.options.parent.childrens.remove(this.id);
        }
        // прехук после уничтожения
        this.afterUnmount();
    }

    // изменение состояния
    setState(newState) {
        this.state = {...this.state, ...newState};
    }

    // прехук до монтирования
    beforeMount() {

    }

    // внутренний прехук до монтирования для передачи задач по цепочки и реализации в базе
    _beforeMount() {
        this.beforeMount();
        this._beforeMountChildren();
    }

    // внутренний прехук для вызова прехуков детей
    _beforeMountChildren() {
        for (let ch in this.childrens.childrens) {
            this.childrens.childrens[ch]._beforeMount();
        }
    }

    // прехук после монтирования
    afterMount() {

    }

    // внутренний прехук для вызова прехуков детей
    _afterMount() {
        this.afterMount();
        this._afterMountChildren();
    }

    _afterMountChildren(){
        for (let ch in this.childrens.childrens) {
            this.childrens.childrens[ch]._afterMount();
        }
    }

    // прехук до обновления
    beforeUpdate() {

    }

    // прехук после обновления
    afterUpdate() {

    }

    // прехук до размонтирования
    beforeUnmount() {

    }

    // прехук после размонтирования
    afterUnmount() {

    }

    // размонтирование детей по цепочке вниз
    unmountChildren() {
        for (let ch in this.childrens.childrens) {
            this.childrens.childrens[ch].unmount();
        }
    }

    // получение контейнера из дома куда смонтирован компонент
    getContainer() {
        if (this.container === undefined) {
            this.container = document.getElementById(this.id);
        }
        return this.container;
    }

    // прехук для получения дефолтных опций компонента, реализуется при наследовании
    getDefaultOptions() {
        return {};
    }

    // view компонента, обязательно должен содержать контейнер!!!
    render() {
        return `<div></div>`;
    }

    // текстовое представление компонента, по сути его рендер
    toString() {
        // если не смонтирован, вызовим прехук
        if (!this.state.isMount) {
            this.beforeMount();
            this.setState({ isMount: true });;
        }
        let template = this.render(this.options, this.state);
        const regexp = /<(([a-z]+)\s*([^>]*))>/m;
        // ищем контейнер компонента в верстке и доставляем ему id
        return template.replace(regexp, `<$1 id="${this.id}">`);
    }
    
    // поиск компонента среди детей по его id
    getById(id) {
        // сначала в своих
        let child = this.childrens.get(id);

        if (child) {
            return child;
        }

        // затем в детях детей по цепочке
        for (let ch in this.childrens.childrens) {
            child = this.childrens.childrens[ch].getById(id);
            if (child) {
                return child;
            }
        }
    }

    // добавление ребенка в компонент и его монтирование
    appendChildren(component, options, container) {
        const child = factory.create(component, { parent: this, ...options });
        this.childrens.add(child);
        child.mount(container || this.getContainer());
    }

    // прдписка любого компонента или его части на событие для его автоматической отписки при уничтожении исходного компонента
    subscribeTo(target, eventName, handler) {
        const handlers = this.handlers[eventName] || [];
        // положим источник и обработчик в список события
        handlers.push({
            target,
            handler
        });
        this.handlers[eventName] = handlers;
        // подпишимся
        target.addEventListener(eventName, handler);
    }

    // отписаться от всех событий
    unsubscribeAll() {
        for (let eventName in this.handlers) {
            this.unsubscribeByEvent(eventName);
        }
    }

    // отписать всех от определенного события
    unsubscribeByEvent(eventName) {
        this.handlers[eventName].forEach(element => {
            element.target.removeEventListener(eventName, element.handler);
        });
    }
}

Component.prototype.generateId = function() {
    return Math.random().toString(32).slice(2);
};


/**
 * Компоновщик — это структурный паттерн проектирования, который позволяет сгруппировать множество объектов в древовидную структуру, 
 * а затем работать с ней так, как будто это единичный объект.
 * https://refactoring.guru/ru/design-patterns/composite
 */
class Composite {
    constructor(options) {
        options = options || {};
        this.childrens = {}
        this.parent = options.parent;
    }

    create(childControl, options) {
        // Создать и добавить компонент в список дочерних.
        options = (options || {})
        options.parent = this.parent;
        const child = factory.create(childControl, options);
        return this.add(child);
    }

    add(child) {
        // Добавить компонент в список дочерних.
        this.childrens[child.id] = child;
        return child;
    }

    remove(id) {
        // Убрать компонент из списка дочерних.
        delete this.childrens[id];
    }
    
    get(id) {
        /// получить компонент
        let child = this.childrens[id];
        return child;
    }
}

/**
 * класс страницы
 */
class Page extends Component {
    render({title, description}) {
        return `
            <div>
                <div class="wraper">
                    ${this.childrens.create(Header, {
                        title,
                        description
                    })}
                    ${this.childrens.create(Persons)}
                </div>
            </div>
        `;
        }
}

class Header extends Component {
    render({title, description}) {
        return `
        <header>
            <div class="card card_header">
                <img class="card__img" src="img/logo.jpg" alt="${title}" />
                <p class="card__title" title="${title}">${title}</p>
                <span class="card__description" title="${description}">${description}</span>
            </div>
        </header>`;
    }
}


/**
 * Модели обеспечивают доступ к данным и поведению объектов предметной области (сущностям).
 * Такими сущностями могут быть, например, товары, пользователи, документы — и другие предметы окружающего мира, 
 * которые вы моделируете в своем приложении.
 * 
 * Базовая модель
 */
class Model {
    constructor(data) {
        for (let k in data) {
            this[k] = data[k];
        }
    }
}

/**
 * Модель персон
 */
class PersonModel extends Model {
    get bdayStr() {
        return this.renderBDay(this.bday || null);
    }

    get activeStr() {
        return this.renderTextDate(this.active || null);
    }

    /**
     * Возращает дату в текстовом виде по формату 'сегодня в HH:MM' или 'DD.MM.YY в HH:MM' если было давно
     * 'неизвестно' в случае если пришел null
     * @param {Date|null} date - дата
     */
    renderTextDate(date) {
        let out = 'неизвестно';
        const now = new Date();
        const days = Math.floor((date - now) / 86400000)*-1;
        const daysStr = ['сегодня', 'вчера', 'позавчера'];
        if (date) {
            out = `${daysStr[days-1] || date.toLocaleDateString()} в ${date.toTimeString().replace(/:[0-9]{2,2} .*/, '')}`;
        }

        return out;
    }

    /**
     * Возвращает дату по формату 'D месяц, N лет'
     * 'скрыто' в случае если пришел null
     * @param {Date|null} date - дата
     */
    renderBDay(date) {
        let out = 'скрыто';
        const months = ['январь', 'февраль', 'март', 'апрель','май', 'июнь', 'июль', 'август','сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
        if (date) {
            const now = new Date();
            const years = now.getFullYear() - date.getFullYear();
            out = `${date.getDate()} ${months[date.getMonth()]}, ${years} лет`;
        }

        return out;
    }
}


/**
 * Компонент списка персон
 */
class Persons extends Component {
    beforeMount() {
        this.setState({
            items: [
                new PersonModel({
                    title: 'Миша Петров',
                    photo: 'img/ava01.jpg',
                    study: 'Угату',
                    bday: new Date('2000-05-01'),
                    phone: '+7 (963) 123-45-67',
                    active: new Date()
                }),

                new PersonModel({
                    title: 'Маша Иванова',
                    photo: 'img/ava02.jpg',
                    study: 'Бгу',
                    bday: new Date('2001-02-08'),
                    phone: '+7 (963) 123-45-67',
                    active: new Date('2020-03-05T20:00:00')
                }),

                new PersonModel({
                    title: 'Женя Серова',
                    photo: 'img/ava03.jpg',
                    study: 'Угату',
                    bday: new Date('1998-11-13'),
                    phone: '+7 (963) 123-45-67',
                    active: new Date('2020-04-03T20:00:00')
                }),

                new PersonModel({
                    title: 'Вася Васильев',
                    photo: 'img/ava04.jpg',
                    study: 'Угату',
                    bday: new Date('2000-05-01'),
                    phone: '+7 (963) 123-45-67',
                    active: new Date()
                }),

                new PersonModel({
                    title: 'Вика Цукерберг',
                    photo: 'img/ava05.jpg',
                    study: 'БГПУ',
                    bday: new Date('2001-02-08'),
                    phone: '+7 (963) 123-45-67',
                    active: new Date('2020-03-05T20:00:00')
                }),

                new PersonModel({
                    title: 'Дедя Федор',
                    photo: 'img/ava06.jpg',
                    study: '',
                    bday: new Date('1974-07-24'),
                    phone: '+7 (963) 123-45-67',
                    active: new Date('2020-04-03T20:00:00')
                })
            ]
        });
    }
    render(options, {items}) {
        return `<div class="persons">
            ${items.map((item) => this.childrens.create(Person, {item})).join('\n')}
        </div>`;
    }
}

/**
 * компонент персоны
 */
class Person extends Component {
    constructor({item}) {
        super();
        this.state.item = item;
    }

    render(options, {item}) {
        return `<div class="card card_person">
            <img class="card__img card__img_round" src="${item.photo || 'img/ui/default_pix.jpg'}" alt="Аватар ${item.title}" />
            <p class="card__title" title="${item.title || ''}">${item.title || ''}</p>
            <span class="card__description" title="${item.study || ''}">${item.study || ''}</span>
        </div>`;
    }

    afterMount() {
        this.subscribeTo(this.getContainer(), 'click', this.onClick.bind(this));
    }

    onClick() {
        this.openPersonPopup(this.state.item);
    }

    openPersonPopup(item) {
        if (this.openPopupAction === undefined) {
            this.openPopupAction = new OpenPopupAction();
        }
        this.openPopupAction.execute({
            caption:  `Был ${item.activeStr}`,
            target: this.getContainer(),
            contentComponent: ProfileMini,
            content: {
                title: item.title,
                photo: {
                    src: item.photo,
                    alt: item.title
                },
                params: [
                    {title: 'День рождения', value: item.bdayStr},
                    {title: 'Телефон', value: item.phone}
                ]
            }
        });
    }
}


/**
 * мини профиль
 */
class ProfileMini extends Component {
    render({title, photo, params}) {
        return `<div class="profile-mini">
                <h3 class="profile-mini__title profile-mini__title_big" title="${title}">${title}</h3>
                <img class="profile-mini__photo" src="${photo.src || 'img/ui/default_pix.jpg'}" alt="${photo.alt}"/>
                <div class="profile-mini__params">
                    ${params.map(this.renderProfileMiniParam).join('\n')}
                </div>
                <div class="profile-mini__futter">
                    <img src="img/ui/message.png" alt="Отправить сообщение" title="Отправить сообщение" class="profile-message-bottom"/>
                    ${this.childrens.create(PersonsMiniList)}
                </div>
            </div>`;
    }

    /**
     * рендер параметра персоны профиля
     * @param {title, value} params title - назыание параметра, value - значение
     */
    renderProfileMiniParam({title='', value=''}) {
        return `<div class="profile-mini__title" title="${title}">${title}</div>
        <div class="profile-mini__value" title="${value}">${value}</div>`;
    }

    getDefaultOptions() {
        return {
            title: 'Неизвестен',
            photo: {
                src: 'img/ui/default_pix.jpg',
                alt: 'Аватар'
            },
            params: []
        }
    }
}

/**
 * компонент друзей для минипрофиля
 */
class PersonsMiniList extends Component {
    render() {
        const avas = [
            {
                photo: {
                    src: 'img/ava01.jpg',
                    alt: 'Петя'
                } 
            },
            {
                photo: {
                    src: 'img/ava02.jpg',
                    alt: 'Маша'
                } 
            },
            {
                photo: {
                    src: 'img/ava03.jpg',
                    alt: 'Саша'
                } 
            },
            {
                photo: {
                    src: 'img/ava04.jpg',
                    alt: 'Вася'
                } 
            }
        ] 
        return `<div class="persons-mini-list">
                <a href="#" class="persons-mini-list__link" title="Друзей 254">Друзей 254</a>
                ${avas.map(this.renderPersonsMiniListAva).join('\n')}
            </div>`;
    }

    renderPersonsMiniListAva({photo}) {
        return `<img src="${photo.src}" alt="${photo.alt}" title="${photo.alt}" class="persons-mini-list__ava"/>`
    }
}

/**
 * Компонент окошка
 */
class Popup extends Component {
    render({caption, content, contentComponent}) {
        return `<div class="popup">
            <div class="popup__header">
                <p class="popup__title" title="${caption}">${caption}</p>
                <img class="popup__closeButton" title="Закрыть" alt="Кнопка закрыть" src="img/ui/close_x.png"/>
            </div>
            <div class="popup__content">
            ${contentComponent ? this.childrens.create(contentComponent, content) : content}
            </div>
        </div>`;
    }

    afterMount() {
        this._closeButton = this.getContainer().querySelector('.popup__closeButton');
        this.subscribeTo(this._closeButton, 'click', this.onClose.bind(this));
        this.setPopupPosition();
    }

    beforeUnmount() {
        delete this._closeButton;
    }

    onClose() {
        this.close();
    }

    close() {
        this.unmount();
    }

    getDefaultOptions() {
        return {
            caption: '',
            content: '',
            contentComponent: undefined,
            target: document.body,
            offset: {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            }
        }
    }

    /**
     * Позиционирует Popup окно
     * @param {Element} popup dom элемент popup 
     * @param {Element} target dom элемент для позиционирования
     * @param {Object} offset объект настроек размера popup
     */
    setPopupPosition() {
        const container = this.getContainer();
        const offset = this.options.offset;

        // выставляем значения по умолчанию для получения реальных размеров в доме
        container.style.left = offset.left + 'px';
        container.style.top = offset.top + 'px';
        
        // получаем реальные размеры элементов окна и таргета и вычисляем куда позиуионировать popup
        let position = this.coutPopupPosition(this.options.target.getBoundingClientRect(), container.getBoundingClientRect());
        container.style.left = position.left + 'px';
        container.style.top = position.top + 'px';
    }

    /**
     * Вычисление положения popup
     * @param {Object} target - объект размеров и положения относительного элемента 
     * @param {Object} offset - объект размеров и положения popup
     * @returns  {left, top} - смещение окна
     */
    coutPopupPosition(target, offset) {
        let {width=0, height=0, left=0, top=0} = offset || {};
        let {left:tleft=0, top:ttop=0} = target || {};

        // получаем размер окна браузера
        const innerWidth = window.innerWidth;
        const innerHeight = window.innerHeight;
        const defOffset = 8; // смещение чтоб не липло к краям

        if (left + width === innerWidth) {
            tleft = 0;
        }

        // берем левый верхний угол таргета и смещение для popup есоли надо
        left = tleft + left;
        top = ttop - top;

        // проверяем влезает ли в окно браузера, если нет, корректируем смещение
        if (tleft + width > innerWidth) {
            left = left + (innerWidth - (width + tleft)) - defOffset;
        }

        if (ttop + height >= innerHeight) {
            top = top + (innerHeight - (ttop + height)) - defOffset;
        }

        return {left, top};
    }
}

/**
 * компонент стека окошек
 */
class PopupStack extends Component {
    render() {
        return `<div class="popup-stack"></div>`;
    }

    clear() {
        this.unmountChildren();
    }

    append(options) {
        this.appendChildren(Popup, options);
    }
}


/**
 * Абстрактная фабрика для создания контролов
 */
class AbstractFactory {
    create(component, options) {
        return new component(options || {});
    }
}

const factory = new AbstractFactory()

const page = factory.create(Page, {
    title: 'Tensor Scool',
    description: 'Это страница школы Тензор в городе Уфа. Тут вы можете познакомиться с нашими учениками и посмотреть темы занятий.'  
});
page.mount(document.body);

const popupStack = factory.create(PopupStack);
popupStack.mount(document.body);


/**
 * Команда — это поведенческий паттерн проектирования, который превращает запросы в объекты, позволяя передавать их как аргументы при вызове методов, ставить запросы в очередь, 
 * логировать их, а также поддерживать отмену операций.
 */

class Action {
    execute(meta) {
        throw new Error('Необходима реализация');
    }
}

class OpenPopupAction extends Action {
    execute(meta) {
        popupStack.clear();
        popupStack.append(meta);
    }
}