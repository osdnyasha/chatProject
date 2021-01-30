"use strict";

requirejs.config({
    baseUrl: "js",
    paths: {
        // плагины для require
        text: "lib/requirejs/text",
        css: "lib/requirejs/native-css",

        // пути проекта для удобства подключения зависимостей
        Comp: "components",
        Base: "components/Base",
        Page: "components/Page",
        AuthPage: "components/AuthPage",
    },
});

/**
 * Абстрактная фабрика для удобного создания контролов
 */
class AbstractFactory {
    create(component, options) {
        return new component(options || {});
    }
}
const factory = new AbstractFactory();

/**
 * Подгружаем страницу нужную и монтируем ее в dom
 */
requirejs(["Page/Page", "AuthPage/AuthPage"], function (Page, AuthPage) {
    "use strict";

    function userIsAuthorizated() {
        if (sessionStorage.getItem("isAutorizated")) {
            showProflePage();
        } else {
            showAuthPage();
        }
    }

    function showProflePage() {
        const page = factory.create(Page, {
            title: "MyProjectName",
            description: "start page",
            content: "page content",
            contentOptions: {
                descr: "опции компонента, если контент класс",
            },
        });
        initPage(page);
    }

    function showAuthPage() {
        const page = factory.create(AuthPage, {});
        initPage(page);
    }

    function initPage(page) {
        // монтируем ее в dom
        page.mount(document.body);
    }

    userIsAuthorizated();
});
