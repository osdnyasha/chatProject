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
requirejs(["Page/Page"], function (Page) {
    "use strict";

    const page = factory.create(Page, {
        title: "MyProjectName",
        description: "start page",
        content: "page content",
        contentOptions: {
            descr: "опции компонента, если контент класс",
        },
    });

    // монтируем ее в dom
    page.mount(document.body);
});
