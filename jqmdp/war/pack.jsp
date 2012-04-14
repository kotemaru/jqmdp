<%@ page contentType="text/html;charset=utf-8"  %>

<%
String ctxpath = request.getContextPath();
String jqmver = request.getParameter("jqmver");
%>

<% if (jqmver.equals("1.0")) { %>
<link rel="stylesheet" href="<%=ctxpath%>/js/jqm/jquery.mobile-1.0.css" />
<script src="<%=ctxpath%>/js/jquery-1.6.4.js"></script>
<script src="<%=ctxpath%>/js/jquery.mobile.jqmdp-1.0rc2.js"></script>
<script src="<%=ctxpath%>/js/jqm/jquery.mobile-1.0.js"></script>

<% } else if (jqmver.equals("1.0.1")) { %>
<link rel="stylesheet" href="<%=ctxpath%>/js/jqm/jquery.mobile-1.0.1.min.css" />
<script src="<%=ctxpath%>/js/jquery-1.7.1.js"></script>
<script src="<%=ctxpath%>/js/jquery.mobile.jqmdp-1.0rc2.js"></script>
<script src="<%=ctxpath%>/js/jqm/jquery.mobile-1.0.1.js"></script>

<% } else { %>
<link rel="stylesheet" href="<%=ctxpath%>/js/jqm11/jquery.mobile-1.1.0-rc.2.min.css" />
<script src="<%=ctxpath%>/js/jquery-1.7.1.js"></script>
<script src="<%=ctxpath%>/js/jquery.mobile.jqmdp-1.0rc2.js"></script>
<script src="<%=ctxpath%>/js/jqm11/jquery.mobile-1.1.0-rc.2.js"></script>
<% } %>
