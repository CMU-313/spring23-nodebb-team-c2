<!-- IMPORT partials/breadcrumbs.tpl -->
<div data-widget-area="header">
    {{{each widgets.header}}}
    {{widgets.header.html}}
    {{{end}}}
</div>
<div class="row">
    <div class="<!-- IF widgets.sidebar.length -->col-lg-9 col-sm-12<!-- ELSE -->col-lg-12<!-- ENDIF widgets.sidebar.length -->">
        <h1 class="career-title">Career</h1>
        <p>
            Welcome to the careers page! This is a brand new feature added to allow 
            students to connect with various job recruiters.
        </p>
        {{{if (!accountType || (accountType == "instructor")) }}} 
            <p>This page is only available for students and recruiters.</p>
        {{{ else }}} 
            {{{ if (accountType == "student") }}}
                 <!-- IMPORT partials/career/student.tpl -->
            {{{ end }}} 
            {{{ if (accountType == "recruiter") }}}
                 <!-- IMPORT partials/career/recruiter.tpl -->
            {{{ end }}} 
        {{{ end }}} 
    </div>
    <div data-widget-area="sidebar" class="col-lg-3 col-sm-12 <!-- IF !widgets.sidebar.length -->hidden<!-- ENDIF !widgets.sidebar.length -->">
        {{{each widgets.sidebar}}}
        {{widgets.sidebar.html}}
        {{{end}}}
    </div>
</div>
<div data-widget-area="footer">
    {{{each widgets.footer}}}
    {{widgets.footer.html}}
    {{{end}}}
</div>
