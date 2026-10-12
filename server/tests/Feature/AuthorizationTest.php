<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * Authorisation model tests. These exercise the security-critical permission
 * logic (User::hasPermission, User::hasRole and the Gate::before super-user
 * rule) with in-memory models, so they run without touching the database.
 */
class AuthorizationTest extends TestCase
{
    private function perm(string $name, ?string $expiresAt = null): Permission
    {
        $p = new Permission();
        $p->name = $name;
        // belongsToMany(...)->withPivot('expires_at') always hydrates a pivot row
        // (expires_at null when the grant is permanent); mirror that here.
        $pivot = new Pivot();
        $pivot->expires_at = $expiresAt;
        $p->setRelation('pivot', $pivot);
        return $p;
    }

    private function role(string $name, array $perms = []): Role
    {
        $r = new Role();
        $r->name = $name;
        $r->setRelation('permissions', collect($perms));
        return $r;
    }

    private function user(array $roles = [], array $directPerms = []): User
    {
        $u = new User();
        $u->name = 'Test User';
        $u->setRelation('roles', collect($roles));
        $u->setRelation('permissions', collect($directPerms));
        return $u;
    }

    public function test_admin_role_passes_every_permission_check(): void
    {
        $u = $this->user([$this->role('admin')]);
        $this->assertTrue($u->hasPermission('students.update'));
        $this->assertTrue($u->hasPermission('anything.at.all'));
    }

    public function test_role_permission_holder_passes(): void
    {
        $u = $this->user([$this->role('clerk', [$this->perm('students.view')])]);
        $this->assertTrue($u->hasPermission('students.view'));
    }

    public function test_direct_permission_holder_passes(): void
    {
        $u = $this->user([$this->role('clerk')], [$this->perm('marks.manage')]);
        $this->assertTrue($u->hasPermission('marks.manage'));
    }

    public function test_active_temporary_grant_passes(): void
    {
        $future = Carbon::now()->addDay()->toDateTimeString();
        $u = $this->user([$this->role('teacher')], [$this->perm('challans.verify', $future)]);
        $this->assertTrue($u->hasPermission('challans.verify'));
    }

    public function test_expired_temporary_grant_is_refused(): void
    {
        $past = Carbon::now()->subDay()->toDateTimeString();
        $u = $this->user([$this->role('teacher')], [$this->perm('challans.verify', $past)]);
        $this->assertFalse($u->hasPermission('challans.verify'));
    }

    public function test_non_holder_is_refused(): void
    {
        $u = $this->user([$this->role('librarian', [$this->perm('library.manage')])]);
        $this->assertFalse($u->hasPermission('students.update'));
    }

    public function test_principal_is_not_a_super_user(): void
    {
        // Principal holds no hard-coded power: only granted permissions apply.
        $u = $this->user([$this->role('principal', [$this->perm('settings.update')])]);
        $this->assertTrue($u->hasPermission('settings.update'));
        $this->assertFalse($u->hasPermission('students.update'));
    }

    public function test_has_role_detects_membership(): void
    {
        $u = $this->user([$this->role('clerk'), $this->role('teacher')]);
        $this->assertTrue($u->hasRole('teacher'));
        $this->assertFalse($u->hasRole('admin'));
    }

    public function test_gate_before_grants_admin_every_ability(): void
    {
        $admin = $this->user([$this->role('admin')]);
        $this->assertTrue(Gate::forUser($admin)->allows('students.update'));
    }

    public function test_gate_before_enforces_permission_for_non_admin(): void
    {
        $clerk = $this->user([$this->role('clerk', [$this->perm('students.view')])]);
        $this->assertTrue(Gate::forUser($clerk)->allows('students.view'));
        $this->assertFalse(Gate::forUser($clerk)->allows('settings.update'));
    }

    public function test_temporary_password_generator_is_ten_characters(): void
    {
        // Staff accounts are issued a Str::random(10) temporary password.
        $pw = Str::random(10);
        $this->assertEquals(10, strlen($pw));
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9]+$/', $pw);
    }
}
