&gt; 🚧 **Work in Progress** — Backend API production-ready with comprehensive test suite (8/8 passing). Frontend React components active development. Open for educational exploration and contributions.

---

## ✅ Current Status

| Component             | Status              | Notes                                                                                       |
| --------------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| **Backend API**       | ✅ Production-ready | JWT auth, role-based permissions, auto-grading, PDF generation, 8 integration tests passing |
| **Database Models**   | ✅ Complete         | Users, profiles, courses, enrollments, assignments, quizzes, submissions, payments          |
| **API Documentation** | ✅ Available        | Auto-generated Swagger/OpenAPI at `/api/schema/`                                            |
| **Frontend React**    | 🔄 In Progress      | Core pages built, UI polish ongoing                                                         |
| **Deployment**        | ⏳ Planned          | Docker configured, PostgreSQL migration ready                                               |
| **Payment Gateway**   | ✅ Integrated       | Paystack client with webhook support                                                        |

---

## 🎯 What I Learned (For Fellow Developers)

This project taught me that **production software is 20% features, 80% edge cases**:

1. **JWT Authentication**: Session auth doesn't work for SPAs. Refresh token rotation is essential.
2. **Testing Strategy**: `format='json'` in DRF tests. Mock external services. Test permissions, not just happy paths.
3. **Security Trade-offs**: 403 vs 404 isn't academic—it affects UX and information leakage.
4. **Pagination Handling**: API returns `{count, results}`, not arrays. Interceptors save frontend sanity.
5. **Auto-grading Logic**: Business rules belong in `perform_create()`, not serializers.

**Full write-up**: [LinkedIn post link when published]

---

## 🤝 Contributing

This is a **learning project**. Found a bug? Better approach? Open an issue or PR. I'll respond to all educational discussions.

---



## 🔗 Connect

- **LinkedIn**: https://www.linkedin.com/in/abdullahi-musliudeen-64435a239/
- **Email**: abdullahmusliudeen@gmail.com
- **Portfolio**:

---

## License

MIT — Fork it, break it, learn from it.
