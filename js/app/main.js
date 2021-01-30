define(['Page/Page', 'Page/Persons'], function (Page, Persons) {
    'use strict';
    
    const page = factory.create(Page, {
        title: 'Tensor Scool',
        description: 'Это страница школы Тензор в городе Уфа. Тут вы можете познакомиться с нашими учениками и посмотреть темы занятий.',
        content: Persons,
        contentOptions: {}
    });
    page.mount(document.body);
});